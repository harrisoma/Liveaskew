import { downscaleDataUrl, PHOTO_MAX } from "../lib/image";
/** Capacitor native bridges with web fallbacks. Safe to import on the web. */

export async function haptic(kind: "impact" | "success" | "warning" = "impact"): Promise<void> {
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    if (kind === "success") {
      await Haptics.notification({ type: NotificationType.Success });
      return;
    }
    if (kind === "warning") {
      await Haptics.notification({ type: NotificationType.Warning });
      return;
    }
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    if (typeof navigator !== "undefined") navigator.vibrate?.(kind === "success" ? [8, 30, 8] : 12);
  }
}

export async function configureNativeChrome(): Promise<void> {
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    // Follow the system appearance, like any iOS app.
    const dark =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    await StatusBar.setStyle({ style: Style.Default });
    await StatusBar.setBackgroundColor({ color: dark ? "#000000" : "#f2f2f7" });
  } catch {
    /* browser preview */
  }
}

export async function pickStylingPhoto(source?: "camera" | "photos"): Promise<string | null> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform())
      return source === "camera" ? takeWebPhoto() : pickFileFallback();
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 70,
      width: 1200,
      resultType: CameraResultType.DataUrl,
      source:
        source === "camera"
          ? CameraSource.Camera
          : source === "photos"
            ? CameraSource.Photos
            : CameraSource.Prompt,
    });
    return photo.dataUrl ?? null;
  } catch {
    return null;
  }
}

/** Camera access starts only after Take a photo; nothing is uploaded here. */
async function takeWebPhoto(): Promise<string | null> {
  if (typeof document === "undefined" || !navigator.mediaDevices?.getUserMedia) return null;
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false,
  });
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "la-camera-dialog";
    dialog.setAttribute("aria-label", "Take your styling photo");
    const title = document.createElement("h2");
    title.textContent = "Your styling photo";
    const note = document.createElement("p");
    note.textContent =
      "Step back so your full outfit is visible. Your photo stays on this device until you request a try-on.";
    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream;
    const capture = document.createElement("button");
    capture.type = "button";
    capture.className = "neo-btn neo-btn-gold";
    capture.textContent = "Use this photo";
    capture.disabled = true;
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "neo-btn";
    cancel.textContent = "Cancel";
    let finished = false;
    const finish = (photo: string | null) => {
      if (finished) return;
      finished = true;
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
      dialog.close();
      dialog.remove();
      resolve(photo);
    };
    video.addEventListener("loadeddata", () => {
      capture.disabled = false;
    });
    capture.addEventListener("click", async () => {
      capture.disabled = true;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context || !canvas.width || !canvas.height) return finish(null);
      context.drawImage(video, 0, 0);
      finish(await downscaleDataUrl(canvas.toDataURL("image/jpeg", 0.82), PHOTO_MAX));
    });
    cancel.addEventListener("click", () => finish(null));
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      finish(null);
    });
    dialog.append(title, note, video, capture, cancel);
    document.body.append(dialog);
    try {
      dialog.showModal();
      void video.play().catch(() => finish(null));
    } catch {
      finish(null);
    }
  });
}

function pickFileFallback(camera = false): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (camera) input.capture = "user";
    input.addEventListener("cancel", () => resolve(null), { once: true });
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () =>
        resolve(
          typeof reader.result === "string" ? downscaleDataUrl(reader.result, PHOTO_MAX) : null,
        );
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

let pushRegistrationBound = false;

async function bindPushRegistration(): Promise<void> {
  if (pushRegistrationBound) return;
  pushRegistrationBound = true;
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const { Capacitor } = await import("@capacitor/core");
  await PushNotifications.addListener("registration", (event) => {
    const raw = Capacitor.getPlatform();
    const platform = raw === "ios" || raw === "android" ? raw : "web";
    void import("../lib/account").then(({ registerPushToken }) =>
      registerPushToken({ token: event.value, platform }),
    );
  });
}

export async function setPushEnabled(enabled: boolean): Promise<boolean> {
  if (!enabled) return false;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await bindPushRegistration();
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive !== "granted") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") return false;
    await PushNotifications.register();
    return true;
  } catch {
    return false;
  }
}

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function pickWardrobeBatch(): Promise<string[]> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve([]);
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []).slice(0, 12);
      const urls = await Promise.all(
        files.map(
          (file) =>
            new Promise<string | null>((ok) => {
              const reader = new FileReader();
              reader.onload = () =>
                ok(
                  typeof reader.result === "string"
                    ? downscaleDataUrl(reader.result, PHOTO_MAX)
                    : null,
                );
              reader.onerror = () => ok(null);
              reader.readAsDataURL(file);
            }),
        ),
      );
      resolve(urls.filter((u): u is string => Boolean(u)));
    };
    input.click();
  });
}
