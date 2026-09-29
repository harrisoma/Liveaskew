/** co.liveaskew.app://… links opened by Stripe or a social network on iOS / Android. */
export function bindReturnLinks(onUrl: (url: string) => void): () => void {
  let remove: (() => void) | undefined;
  void (async () => {
    try {
      const { App } = await import("@capacitor/app");
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      const handle = await App.addListener("appUrlOpen", (event) => onUrl(event.url));
      remove = () => {
        void handle.remove();
      };
    } catch {
      /* web */
    }
  })();
  return () => remove?.();
}
