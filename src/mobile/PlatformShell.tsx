import type { ReactNode } from "react";
import crestBee from "@/assets/brand/crest-bee.webp";
import { isNativeApp } from "./lib/platform";
import "./styles.css";

export function PlatformShell({ children }: { children: ReactNode }) {
  if (isNativeApp()) return <>{children}</>;

  return (
    <div className="la-web-shell">
      <aside className="la-web-aside" aria-label="About LiveAskew">
        <img src={crestBee} alt="" className="h-16 w-16" />
        <p className="la-display mt-6 text-[2.5rem] leading-[1.05] font-bold">
          Dressed for the day you actually have.
        </p>
        <p className="mt-4 text-[1.0625rem] leading-relaxed opacity-60">
          Bee styles you, Honey plans your days, Buzz shares your looks, and the Hive talks it
          through. The same app on the web, iPhone, and Android.
        </p>
        <div className="mt-8 flex gap-6 text-[0.95rem] font-medium">
          <a href="/" style={{ color: "var(--gold)" }}>
            About LiveAskew
          </a>
          <a href="/privacy" style={{ color: "var(--gold)" }}>
            Privacy
          </a>
        </div>
      </aside>
      {children}
    </div>
  );
}
