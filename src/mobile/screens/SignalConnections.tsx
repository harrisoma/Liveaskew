import { useCallback, useEffect, useState } from "react";
import type { SignalSummary } from "@/lib/buzz/signal-contract";
import { apiFetch } from "../lib/api";
import { openExternal } from "../lib/external";
import { NeoButton, Screen } from "../components/ui";
const providers = [
  ["meta", "Facebook & Instagram"],
  ["threads", "Threads"],
  ["linkedin", "LinkedIn"],
  ["tiktok", "TikTok"],
  ["x", "X"],
  ["youtube", "YouTube"],
  ["google_business", "Google Business Profile"],
] as const;
export function SignalConnections() {
  const [summary, setSummary] = useState<SignalSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const refresh = useCallback(async () => {
    try {
      const response = await apiFetch("/api/buzz/signal");
      const data = await response.json();
      if (!response.ok || !data.enabled) throw new Error();
      setSummary(data);
    } catch {
      setNotice("Your accounts couldn’t load. Please try again.");
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function act(body: unknown) {
    setBusy(true);
    setNotice("");
    try {
      const response = await apiFetch("/api/buzz/signal", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error();
      if (data.url) await openExternal(data.url);
      else {
        await refresh();
        setNotice("Account settings updated.");
      }
    } catch {
      setNotice("This connection isn’t available right now. You can try again later.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen kicker="Buzz" title="Your social accounts">
      <p className="text-sm leading-relaxed">
        Connect through Onixus Signal, then choose the pages or profiles you want to use. Connecting
        never publishes a post.
      </p>
      <p className="mt-3 text-sm opacity-70">
        Posting through Signal is not available yet. Your styling experience is ready to use.
      </p>
      {notice && (
        <p className="neo-inset mt-4 p-3 text-sm" role="status">
          {notice}
        </p>
      )}
      <NeoButton className="mt-4" disabled={busy} onClick={() => void refresh()}>
        Refresh accounts
      </NeoButton>
      <div className="mt-4 space-y-4">
        {providers.map(([id, label]) => {
          const connection = summary?.connections.find(
            (c) => c.provider === id && c.status !== "disabled",
          );
          return (
            <section className="neo-raised p-4" key={id} aria-label={label}>
              <h2 className="font-semibold">{label}</h2>
              {connection && (
                <p className="mt-1 text-sm">
                  {connection.status === "connected"
                    ? "Authorized. Choose your destinations below."
                    : "Reconnect to finish setup."}
                </p>
              )}
              {connection?.assets
                .filter((a) => a.status === "active")
                .map((asset) => (
                  <label className="mt-3 flex min-h-11 items-center gap-3 text-sm" key={asset.id}>
                    <input
                      type="checkbox"
                      checked={asset.selected}
                      disabled={busy || connection.status !== "connected"}
                      onChange={(e) =>
                        void act({
                          action: "select",
                          connectionId: connection.id,
                          assetIds: connection.assets
                            .filter((a) => (a.id === asset.id ? e.target.checked : a.selected))
                            .map((a) => a.id),
                        })
                      }
                    />
                    {asset.display_name || asset.username || asset.platform}
                  </label>
                ))}
              <NeoButton
                className="mt-3"
                disabled={busy || !summary}
                onClick={() => void act({ action: "connect", provider: id })}
              >
                {connection ? "Reconnect" : "Connect"}
              </NeoButton>
              {connection && (
                <NeoButton
                  className="mt-2"
                  disabled={busy}
                  onClick={() => void act({ action: "disconnect", connectionId: connection.id })}
                >
                  Disconnect from Buzz
                </NeoButton>
              )}
            </section>
          );
        })}
      </div>
      <p className="mt-4 text-sm opacity-70">
        Disconnecting removes Signal’s stored access. You can also revoke access in the social
        platform’s settings.
      </p>
    </Screen>
  );
}
