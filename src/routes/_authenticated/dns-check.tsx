import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { checkEmailNsDelegation } from "@/lib/dns-check.functions";
import { checkIsAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/dns-check")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { isAdmin } = await checkIsAdmin();
      if (!isAdmin) throw redirect({ to: "/" });
    } catch (err) {
      if (err && typeof err === "object" && "isRedirect" in (err as object)) throw err;
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "NS Delegation Check — liveaskew.com" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DnsCheckPage,
});

function DnsCheckPage() {
  const [host, setHost] = useState("notify.liveaskew.com");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const check = useServerFn(checkEmailNsDelegation);

  const { data, isFetching, refetch, dataUpdatedAt, error } = useQuery({
    queryKey: ["ns-check", host],
    queryFn: () => check({ data: { host } }),
    refetchInterval: (q) => (autoRefresh && !q.state.data?.verified ? 15_000 : false),
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          DNS Verification
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Email NS Delegation Check
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Polls Cloudflare and Google public DNS to confirm the NS records for
          the email subdomain delegate to Lovable. Auto-refreshes every 15s
          until verified.
        </p>

        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Host to check
            </label>
            <input
              value={host}
              onChange={(e) => setHost(e.target.value.trim())}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
              placeholder="notify.liveaskew.com"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {isFetching ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Check now
          </button>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error instanceof Error ? error.message : "Check failed"}
          </div>
        )}

        {data && (
          <div className="mt-6 space-y-4">
            <div
              className={`flex items-start gap-3 rounded-lg border p-4 ${
                data.verified
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-amber-500/30 bg-amber-500/5"
              }`}
            >
              {data.verified ? (
                <CheckCircle2 className="mt-0.5 text-emerald-600" size={20} />
              ) : (
                <Loader2 className="mt-0.5 animate-spin text-amber-600" size={20} />
              )}
              <div className="flex-1">
                <h2 className="font-semibold text-foreground">
                  {data.verified
                    ? "Delegation verified"
                    : "Waiting for NS records to propagate"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Last checked {new Date(dataUpdatedAt).toLocaleTimeString()} —{" "}
                  <code className="font-mono">{data.host}</code>
                </p>
              </div>
            </div>

            <Section title="Expected nameservers">
              <ul className="space-y-1">
                {data.expected.map((ns) => {
                  const ok = data.matched.includes(ns);
                  return (
                    <li
                      key={ns}
                      className="flex items-center gap-2 font-mono text-sm"
                    >
                      {ok ? (
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      ) : (
                        <XCircle size={14} className="text-rose-500" />
                      )}
                      <span>{ns}</span>
                    </li>
                  );
                })}
              </ul>
            </Section>

            <Section title="Observed at public resolvers">
              {data.observed.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No NS records observed yet.
                </p>
              ) : (
                <ul className="space-y-1 font-mono text-sm">
                  {data.observed.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <Resolver name="Cloudflare 1.1.1.1" result={data.resolvers.cloudflare} />
                <Resolver name="Google 8.8.8.8" result={data.resolvers.google} />
              </div>
            </Section>

            {!data.verified && data.missing.length > 0 && (
              <Section title="What to do">
                <p className="text-sm text-muted-foreground">
                  At your DNS provider for{" "}
                  <code className="font-mono">liveaskew.com</code>, add NS
                  records on host <code className="font-mono">notify</code>{" "}
                  pointing to:
                </p>
                <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
{data.missing.map((n) => `notify  NS  ${n}.`).join("\n")}
                </pre>
                <p className="mt-2 text-xs text-muted-foreground">
                  Propagation usually takes 5–30 minutes. This page will turn
                  green automatically once both records are visible.
                </p>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Resolver({
  name,
  result,
}: {
  name: string;
  result: { ok: true; ns: string[] } | { ok: false; error: string };
}) {
  return (
    <div className="rounded border border-border/60 p-2">
      <div className="font-medium text-foreground">{name}</div>
      {result.ok ? (
        <div className="font-mono">
          {result.ns.length ? result.ns.join(", ") : "(no NS)"}
        </div>
      ) : (
        <div className="text-rose-500">error: {result.error}</div>
      )}
    </div>
  );
}
