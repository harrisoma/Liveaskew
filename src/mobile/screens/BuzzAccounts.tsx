import { Check, Link2, LockKeyhole } from "lucide-react";
import { NETWORKS, type NetworkId } from "@/lib/buzz";
import type { BuzzAccounts } from "../lib/buzz-client";
import "./community.css";
export function BuzzAccountPanel({
  accounts,
  onConnect,
  onDisconnect,
}: {
  accounts: BuzzAccounts | null;
  onConnect: (n: NetworkId) => void;
  onDisconnect: (n: NetworkId) => void;
}) {
  const connections = new Map((accounts?.connections ?? []).map((c) => [c.network, c]));
  return (
    <section className="la-buzz-accounts" aria-labelledby="accounts-title">
      <div className="la-community-section-heading">
        <div>
          <h2 id="accounts-title">Your social accounts</h2>
          <p>Connect your own accounts. You choose what goes out.</p>
        </div>
        <span>
          <Link2 size={14} aria-hidden /> {connections.size} connected
        </span>
      </div>
      <div className="la-network-grid">
        {NETWORKS.map((n) => {
          const c = connections.get(n.id);
          const expired = !!c?.expiresAt && Date.parse(c.expiresAt) <= Date.now();
          const enabled = accounts?.available.includes(n.id);
          return (
            <article key={n.id} className="la-network">
              <div className="la-network-top">
                <img src={`/social/${n.id}.svg`} alt="" width="26" height="26" />
                <strong>{n.label}</strong>
              </div>
              <p>
                {c
                  ? expired
                    ? "Reconnect to keep sharing"
                    : c.accountName || "Account connected"
                  : accounts
                    ? enabled
                      ? "Ready to connect"
                      : "Not enabled on this app yet"
                    : "Sign in or reconnect to load accounts"}
              </p>
              {c ? (
                <>
                  <span className={expired ? "la-network-state" : "la-network-state connected"}>
                    {expired ? (
                      "Connection expired"
                    ) : (
                      <>
                        <Check size={12} aria-hidden /> Connected
                      </>
                    )}
                  </span>
                  <button className="la-network-action" onClick={() => onDisconnect(n.id)}>
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  className="la-network-connect"
                  disabled={!enabled}
                  onClick={() => onConnect(n.id)}
                >
                  {enabled ? "Connect account" : "Unavailable"}
                </button>
              )}
            </article>
          );
        })}
      </div>
      <p className="la-community-note">
        <LockKeyhole size={13} aria-hidden /> Only the look and caption you approve are shared. Your
        private style interview stays in LiveAskew.
      </p>
    </section>
  );
}
