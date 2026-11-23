import { useState } from "react";
import { ArrowRight } from "lucide-react";

/**
 * Starts the $199/month Design Studio subscription in Stripe Checkout.
 * If payments aren't switched on yet, it sends the visitor to the booking form instead,
 * so nobody hits a dead end.
 */
export function StudioCheckoutButton({
  label = "Start the Design Studio",
  className = "la-btn la-btn-dark",
}: {
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function start() {
    setBusy(true);
    setNote("");
    try {
      const res = await fetch("/api/public/studio-checkout", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && json.url) {
        window.location.assign(json.url);
        return;
      }
      if (json.error === "rate_limited") {
        setNote("Too many attempts. Try again in a few minutes.");
      } else {
        window.location.assign(
          "/book?service=design-studio&focus=Design%20Studio%20%E2%80%94%20%24199%2Fmonth",
        );
        return;
      }
    } catch {
      setNote("No connection. Try again in a moment.");
    }
    setBusy(false);
  }

  return (
    <span className="inline-flex flex-col items-start gap-2">
      <button type="button" className={className} onClick={start} disabled={busy}>
        {busy ? "Opening checkout…" : label} <ArrowRight size={18} aria-hidden />
      </button>
      {note ? (
        <span role="alert" className="text-[0.85rem] text-[#a3261b]">
          {note}
        </span>
      ) : null}
    </span>
  );
}
