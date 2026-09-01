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
      className="neu-raised fixed bottom-5 left-5 z-40 hidden md:flex items-center gap-1 rounded-full p-1.5"
    >
      <Link
        to="/dashboard"
        aria-current={onDashboard ? "page" : undefined}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${
          onDashboard
            ? "bg-gradient-to-br from-gold to-gold-deep text-ink"
            : "text-ink/60 hover:text-ink"
        }`}
      >
        <LayoutGrid size={14} />
        Dashboard
      </Link>
      <Link
        to="/chat"
        aria-current={onChat ? "page" : undefined}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${
          onChat
            ? "bg-gradient-to-br from-gold to-gold-deep text-ink"
            : "text-ink/60 hover:text-ink"
        }`}
      >
        <MessageCircle size={14} />
        Chat with Bee
      </Link>
    </nav>
  );
}
