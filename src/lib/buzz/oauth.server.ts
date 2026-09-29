/** The one callback URL to register with every network: <PUBLIC_APP_URL>/api/public/buzz/callback */
export function buzzRedirectUri(request: Request): string {
  const base = (process.env.PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
  return `${base}/api/public/buzz/callback`;
}

/** After connecting, go back to the web app or the native app — never anywhere else. */
export function safeBuzzReturn(raw: string | undefined, request: Request): string {
  const origin = (process.env.PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
  if (raw) {
    try {
      const url = new URL(raw);
      if (url.protocol === "co.liveaskew.app:") return raw;
      if (url.origin === origin || url.origin === new URL(request.url).origin)
        return url.toString();
    } catch {
      /* fall through */
    }
  }
  return `${origin}/`;
}

export function withQuery(url: string, params: Record<string, string>): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${new URLSearchParams(params).toString()}`;
}
