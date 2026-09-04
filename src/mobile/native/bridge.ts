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
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: "#e0e5ec" });
  } catch {
    /* browser preview */
  }
}

export async function pickStylingPhoto(): Promise<string | null> {
  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 70,
      width: 1200,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
    });
    return photo.dataUrl ?? null;
  } catch {
    return pickFileFallback();
  }
}

function pickFileFallback(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
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
              reader.onload = () => ok(typeof reader.result === "string" ? reader.result : null);
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
