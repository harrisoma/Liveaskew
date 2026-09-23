import type { ReactNode } from "react";
import { BeeLogo } from "./components/BrandMarks";
import { isNativeApp } from "./lib/platform";
import "./styles.css";

export function PlatformShell({ children }: { children: ReactNode }) {
  if (isNativeApp()) return <>{children}</>;

  return (
    <div className="la-web-shell">
      <aside className="la-web-aside" aria-label="Bee platforms">
        <BeeLogo className="h-24 w-24" />
        <p className="la-kicker mt-4">LiveAskew</p>
        <p className="la-display mt-2 text-4xl">Bee</p>
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
