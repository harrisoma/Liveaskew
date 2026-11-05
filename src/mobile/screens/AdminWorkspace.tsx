import { SoundControl } from "../components/InteractionFeedback";
import { HoneyScreen } from "./Honey";
import { WardrobeReset } from "./WardrobeReset";
import { isoDay, type HoneyItem } from "@/lib/honey";
import type { WardrobeItem } from "../lib/storage";
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
  onOpenCustomer,
  renderChat,
}: {
  email: string | null;
  onSignOut: () => Promise<void>;
  onOpenCustomer: () => void;
  renderChat: (props: PreviewChatProps) => ReactNode;
}) {
  const [view, setView] = useState<"home" | "today" | "bee" | "honey" | "wardrobe" | "moderation">(
    "home",
  );
  const [sampleEvents, setSampleEvents] = useState<HoneyItem[]>([]);
  const [sampleWardrobe, setSampleWardrobe] = useState<WardrobeItem[]>([
    {
      id: "sample-dress",
      photo: "",
      label: "Blue cotton dress",
      verdict: "keep",
      reason: "Sample piece: comfortable for warm days.",
      error: null,
    },
    {
      id: "sample-shirt",
      photo: "",
      label: "White linen shirt",
      verdict: "maybe",
      reason: "Sample piece: check the sleeve fit.",
      error: null,
    },
  ]);
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
  const preview = view === "today" || view === "bee" || view === "honey" || view === "wardrobe";
  return (
    <div className="la-app flex flex-col">
      <header className="la-topbar">
        <span className="la-wordmark">
          Live<b>Askew</b>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm">Admin</span>
          <SoundControl />
        </div>
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
          <div className="la-admin-preview-tabs mt-2 grid grid-cols-4 gap-1">
            <NeoButton aria-pressed={view === "today"} onClick={() => setView("today")}>
              Today
            </NeoButton>
            <NeoButton aria-pressed={view === "bee"} onClick={() => setView("bee")}>
              Bee
            </NeoButton>
            <NeoButton aria-pressed={view === "honey"} onClick={() => setView("honey")}>
              Honey
            </NeoButton>
            <NeoButton aria-pressed={view === "wardrobe"} onClick={() => setView("wardrobe")}>
              Wardrobe
            </NeoButton>
          </div>
        </div>
      )}
      {view === "honey" && (
        <HoneyScreen
          items={sampleEvents}
          today={isoDay(new Date())}
          looks={[]}
          dressingId={null}
          feeds={[]}
          importing={false}
          notice={notice}
          onAdd={(input) =>
            setSampleEvents((items) => [
              ...items,
              {
                ...input,
                id: crypto.randomUUID(),
                source: "manual",
                network: null,
                caption: null,
                postStatus: null,
                beeNote: null,
              },
            ])
          }
          onUpdate={(item) =>
            setSampleEvents((items) => items.map((i) => (i.id === item.id ? item : i)))
          }
          onDelete={(item) => setSampleEvents((items) => items.filter((i) => i.id !== item.id))}
          onDressMe={() => setNotice("Sample preview: styling is available in your customer view.")}
          onImport={() => setNotice("Sample preview: connect calendars in your customer view.")}
        />
      )}
      {view === "wardrobe" && (
        <WardrobeReset
          items={sampleWardrobe}
          busy={false}
          error={notice}
          onUpload={() => setNotice("Sample preview: add your own photos in customer view.")}
          onSync={() => setNotice("Sample preview: account sync is available in customer view.")}
          onStyle={() => setNotice("Sample preview: Bee styles your kept pieces in customer view.")}
          onRetry={() => {}}
          onRename={(id, label) =>
            setSampleWardrobe((items) => items.map((i) => (i.id === id ? { ...i, label } : i)))
          }
          onDecide={(id, verdict) =>
            setSampleWardrobe((items) => items.map((i) => (i.id === id ? { ...i, verdict } : i)))
          }
        />
      )}
      {notice && view !== "honey" && view !== "wardrobe" && (
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
          <section className="mt-6 neo-inset p-4" aria-label="Your customer experience">
            <h2 className="text-lg font-semibold">Use LiveAskew as yourself</h2>
            <p className="mt-2 mb-4 text-sm leading-relaxed">
              Complete your style setup, talk to Bee, and use your own Style Guide with this
              account. Your preferences and activity are saved. Normal trial and membership rules
              apply.
            </p>
            <NeoButton variant="gold" onClick={onOpenCustomer}>
              Switch to customer view
            </NeoButton>
            <p className="mt-3 text-xs opacity-70">
              Return here with Back to Admin. Switching views does not start a trial or
              subscription.
            </p>
          </section>
          <section className="mt-5 space-y-3" aria-label="Admin tools">
            <NeoButton disabled={busy} onClick={() => void openModeration()}>
              {busy ? "Loading reports…" : "Review Hive reports"}
            </NeoButton>
            <NeoButton
              onClick={() => {
                setNotice("");
                setView("today");
              }}
            >
              Preview sample screens
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
