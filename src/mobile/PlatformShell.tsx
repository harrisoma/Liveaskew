import type { ReactNode } from "react";
import { BeeLogo } from "./components/BrandMarks";
import { isNativeApp } from "./lib/platform";
import "./styles.css";

export function PlatformShell({ children }: { children: ReactNode }) {
  if (isNativeApp()) return <>{children}</>;

  return (
    <div className="la-web-shell">
      <aside className="la-web-aside" aria-label="Bee platforms">
        <div className="flex items-center gap-3">
          <BeeLogo className="h-20 w-20 shrink-0" />
          <p className="la-display text-[1.65rem] leading-none font-semibold tracking-tight">
            <span className="mr-1 text-base font-medium opacity-60">by</span>
            LiveAskew
          </p>
        </div>
        <p className="mt-4 text-sm leading-relaxed">
          The same personal stylist on the web app, iPhone, and Android. Clothes follow your body —
          we never alter it.
        </p>
        <ul className="mt-6 space-y-2 text-sm">
          <li className="neo-raised-sm px-3 py-2">Web app — this browser</li>
          <li className="neo-raised-sm px-3 py-2">iOS — Bee, bundle co.liveaskew.app</li>
          <li className="neo-raised-sm px-3 py-2">Android — Bee, applicationId co.liveaskew.app</li>
        </ul>
        <a className="mt-6 inline-block text-sm underline underline-offset-4" href="/privacy">
          Privacy policy
        </a>
      </aside>
      {children}
    </div>
  );
}
