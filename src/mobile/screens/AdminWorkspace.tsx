import { apiFetch } from "../lib/api";
import type { AdminOverview } from "./AdminHome";
import { AdminHome } from "./AdminHome";
import { SoundControl } from "../components/InteractionFeedback";
import { HoneyScreen } from "./Honey";
import { WardrobeReset } from "./WardrobeReset";
import { isoDay, type HoneyItem } from "@/lib/honey";
import type { WardrobeItem } from "../lib/storage";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { TodayScreen } from "./Today";
import { ModerationScreen } from "./Moderation";
import { NeoButton } from "../components/ui";
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
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(false);
  const refreshOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const response = await apiFetch("/api/hive/moderation?overview=1");
      if (!response.ok) throw new Error("overview_unavailable");
      setOverview(await response.json());
      setOverviewError(false);
    } catch {
      setOverviewError(true);
    } finally {
      setOverviewLoading(false);
    }
  }, []);
  useEffect(() => {
    void refreshOverview();
  }, [refreshOverview]);
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
    <div className="la-app la-admin-workspace flex flex-col">
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
        <AdminHome
          overview={overview}
          loading={overviewLoading}
          loadError={overviewError}
          onRefresh={() => void refreshOverview()}
          email={email}
          busy={busy}
          onOpenCustomer={onOpenCustomer}
          onReports={() => void openModeration()}
          onPreview={() => {
            setNotice("");
            setView("today");
          }}
          onSignOut={() => void onSignOut()}
        />
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
          onOpenGuide={() => setNotice("Open your customer view to see your personal Style Guide.")}
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
