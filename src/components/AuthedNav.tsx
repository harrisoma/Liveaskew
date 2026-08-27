import { Link, useLocation } from "@tanstack/react-router";
import { LayoutGrid, MessageCircle } from "lucide-react";

/**
 * Persistent nav for authenticated pages — Dashboard + Chat with Bee.
 * Fixed bottom-left so it never fights page-level top-right controls
 * (chat voice toggles, dashboard plan link, etc.).
 * Hides on /auth, /verify-email, and the current route the user is on.
 */
const HIDDEN_PREFIXES = ["/auth", "/verify-email", "/checkout"];

export function AuthedNav() {
  const { pathname } = useLocation();
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const onDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const onChat = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <nav
      aria-label="Member navigation"
      className="fixed bottom-5 left-5 z-40 hidden md:flex items-center gap-1 border border-ink/15 bg-cream/95 px-1.5 py-1.5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.25)] backdrop-blur"
    >
      <Link
        to="/dashboard"
        aria-current={onDashboard ? "page" : undefined}
        className={`inline-flex items-center gap-2 px-3 py-2 text-[0.62rem] font-medium tracking-[0.24em] uppercase transition ${
          onDashboard
            ? "bg-ink text-cream"
            : "text-ink/70 hover:text-gold-deep"
        }`}
      >
        <LayoutGrid size={12} />
        Dashboard
      </Link>
      <Link
        to="/chat"
        aria-current={onChat ? "page" : undefined}
        className={`inline-flex items-center gap-2 px-3 py-2 text-[0.62rem] font-medium tracking-[0.24em] uppercase transition ${
          onChat
            ? "bg-ink text-cream"
            : "text-ink/70 hover:text-gold-deep"
        }`}
      >
        <MessageCircle size={12} />
        Chat with Bee
      </Link>
    </nav>
  );
}
