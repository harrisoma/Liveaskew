import { useState, type ReactNode } from "react";
import { TodayScreen } from "./Today";
import { ModerationScreen } from "./Moderation";
import { NeoButton, Screen } from "../components/ui";
import { fetchModerationQueue, type ModerationItem } from "../lib/moderation";
import type { ChatMsg } from "../lib/storage";

type PreviewChatProps = {
  messages: ChatMsg[];
  sending: boolean;
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
};
export function AdminWorkspace({
  email,
  onSignOut,
  renderChat,
}: {
  email: string | null;
  onSignOut: () => Promise<void>;
  renderChat: (props: PreviewChatProps) => ReactNode;
}) {
  const [view, setView] = useState<"home" | "today" | "bee" | "moderation">("home");
  const [queue, setQueue] = useState<ModerationItem[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "preview-intro",
      role: "assistant",
      content:
        "Welcome to the Bee layout preview. This conversation is local to this screen and does not send messages or generate looks.",
    },
  ]);
  async function openModeration() {
    setBusy(true);
    setNotice("");
    const items = await fetchModerationQueue();
    setBusy(false);
    if (!items) {
      setNotice(
        "The queue could not load. Check your connection and administrator access, then retry.",
      );
      return;
    }
    setQueue(items);
    setView("moderation");
  }
  const preview = view === "today" || view === "bee";
  return (
    <div className="la-app flex flex-col">
      <header className="la-topbar">
        <span className="la-wordmark">
          Live<b>Askew</b>
        </span>
        <span className="text-sm">Admin</span>
      </header>
      {view !== "home" && (
        <div className="px-5 py-2">
          <NeoButton
            onClick={() => {
              setView("home");
              setNotice("");
            }}
          >
            Back to admin
          </NeoButton>
        </div>
      )}
      {preview && (
        <div className="px-5 py-2">
          <p className="text-sm" role="status">
            Customer layout preview · Sample state · No trial or account changes
          </p>
          <div className="mt-2 flex gap-2">
            <NeoButton aria-pressed={view === "today"} onClick={() => setView("today")}>
              Today
            </NeoButton>
            <NeoButton aria-pressed={view === "bee"} onClick={() => setView("bee")}>
              Bee
            </NeoButton>
          </div>
        </div>
      )}
      {notice && (
        <p className="mx-5 p-3 neo-inset text-sm" role="status">
          {notice}
        </p>
      )}
      {view === "home" && (
        <Screen kicker="Administration" title="Welcome back">
          <p className="text-sm">
            Signed in{email ? ` as ${email}` : ""}. Your administrator access is verified by the
            server.
          </p>
          <section className="mt-6 space-y-3" aria-label="Admin tools">
            <NeoButton variant="gold" disabled={busy} onClick={() => void openModeration()}>
              {busy ? "Loading reports…" : "Review Hive reports"}
            </NeoButton>
            <NeoButton
              onClick={() => {
                setNotice("");
                setView("today");
              }}
            >
              Preview Today and Bee
            </NeoButton>
            <a className="neo-btn" href="/" target="_blank" rel="noreferrer">
              View marketing website
            </a>
          </section>
          <p className="mt-6 text-sm opacity-70">
            The preview uses sample content. Live moderation actions affect the Hive. Customer
            onboarding is not required for these admin tools.
          </p>
          <NeoButton className="mt-6" onClick={() => void onSignOut()}>
            Sign out
          </NeoButton>
        </Screen>
      )}
      {view === "today" && (
        <TodayScreen
          now={new Date()}
          today={new Date().toLocaleDateString("en-CA")}
          looks={[]}
          selfie={null}
          honey={[]}
          dressingId={null}
          buzzConnected={null}
          onOpen={(destination) => {
            if (destination === "bee") {
              setNotice("");
              setView("bee");
            } else
              setNotice(
                "This layout preview covers Today and Bee. Other customer tools are not connected here.",
              );
          }}
          onOpenLook={() => setView("bee")}
          onDressMe={() => setNotice("Outfit generation is disabled in this layout preview.")}
        />
      )}
      {view === "bee" &&
        renderChat({
          messages,
          sending: false,
          input,
          setInput,
          onSend: () => {
            if (!input.trim()) return;
            setMessages((current) => [
              ...current,
              { id: crypto.randomUUID(), role: "user", content: input.trim() },
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                  "Preview only — your message was not sent to AI. This lets you check the conversation layout.",
              },
            ]);
            setInput("");
          },
        })}
      {view === "moderation" && (
        <ModerationScreen
          items={queue}
          onBack={() => setView("home")}
          onChanged={(id) => setQueue((current) => current.filter((item) => item.id !== id))}
        />
      )}
    </div>
  );
}
