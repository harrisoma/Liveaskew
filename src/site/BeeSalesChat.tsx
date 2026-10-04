import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { containsPaymentDetails } from "@/lib/bee-sales";

type Message = { role: "user" | "assistant"; content: string };

export function BeeSalesChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi, I’m Bee, your AI stylist inside LiveAskew. I can explain how styling works and walk you through getting started: create your account, share your style, choose a plan, and add your card securely to activate your 14-day trial. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    else if (!open) dialog.current?.close();
  }, [open]);
  useEffect(() => {
    if (open) end.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy, open]);

  async function send(text: string) {
    if (busy || !text.trim()) return;
    if (containsPaymentDetails(text)) {
      setError(
        "Please do not send card details in chat. Enter them only in secure Stripe checkout.",
      );
      return;
    }
    const next: Message[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/public/bee-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-8) }),
        signal: AbortSignal.timeout(25000),
      });
      const result = (await response.json()) as { text?: string };
      if (!response.ok || !result.text) throw new Error("unavailable");
      setMessages([...next, { role: "assistant", content: result.text }]);
    } catch {
      setError(
        "Bee’s live replies are unavailable right now. You can still start guided setup below, or try your question again shortly.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="bee-sales-title"
      className="bee-sales-dialog"
    >
      <div className="flex items-center justify-between gap-4 border-b border-black/10 p-5">
        <div>
          <p className="kicker">LiveAskew</p>
          <h2 id="bee-sales-title" className="text-2xl font-semibold">
            Meet Bee
          </h2>
          <p className="text-sm text-black/65">Your AI stylist &amp; setup guide</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Bee chat"
          className="rounded-full p-3 hover:bg-black/5"
        >
          <X size={22} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div role="log" aria-live="polite" aria-relevant="additions" className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`rounded-2xl p-4 ${message.role === "user" ? "ml-8 bg-[#96722e]/10" : "mr-4 border border-black/10 bg-white/80"}`}
            >
              <p className="mb-1 text-xs font-semibold">
                {message.role === "user" ? "You" : "Bee"}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            </div>
          ))}
        </div>
        {busy && (
          <p role="status" className="mt-3 text-sm">
            Bee is replying…
          </p>
        )}
        <div ref={end} />
        {messages.length === 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "How does styling work?",
              "How does the trial work?",
              "Which plan should I choose?",
            ].map((question) => (
              <button
                key={question}
                type="button"
                disabled={busy}
                onClick={() => void send(question)}
                className="rounded-full border border-black/20 px-3 py-2 text-sm"
              >
                {question}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-black/10 p-5">
        {error && (
          <p role="alert" className="mb-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
          className="flex gap-2"
        >
          <label htmlFor="bee-sales-message" className="sr-only">
            Ask Bee about LiveAskew
          </label>
          <input
            id="bee-sales-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={600}
            placeholder="Ask Bee about getting started…"
            className="min-w-0 flex-1 rounded-xl border border-black/20 bg-white px-3 py-3"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="glass-btn disabled:opacity-50"
          >
            Send
          </button>
        </form>
        <p className="mt-2 text-xs text-black/60">
          AI replies. Do not share card details here.{" "}
          <a href="/privacy" className="underline">
            Privacy
          </a>
        </p>
        <a href="/app" className="glass-btn glass-btn-gold mt-4 w-full justify-center">
          Set up my free trial
        </a>
        <p className="mt-2 text-xs leading-relaxed text-black/65">
          For new eligible members. Card required. Your selected plan renews monthly after 14 days
          unless cancelled.
        </p>
      </div>
    </dialog>
  );
}
