async function nativeBrowser() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return null;
    const { Browser } = await import("@capacitor/browser");
    return Browser;
  } catch {
    return null;
  }
}

/**
 * Sign-in, checkout, and social connect pages open in the system browser sheet on
 * iOS / Android (Google refuses sign-in inside an app's own web view), and in the
 * same tab on the web. They come back through co.liveaskew.app:// links.
 */
export async function openExternal(url: string): Promise<void> {
  const browser = await nativeBrowser();
  if (browser) {
    await browser.open({ url, presentationStyle: "popover" });
    return;
  }
  window.location.assign(url);
}

/** Dismiss the browser sheet once the app link has brought the person back. */
export async function closeExternal(): Promise<void> {
  const browser = await nativeBrowser();
  try {
    await browser?.close();
  } catch {
    /* already closed (Android closes itself) */
  }
}

export async function isNativeApp(): Promise<boolean> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
