import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { checkIsAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/dns-migration")({
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
  component: DnsMigrationWizard,
  head: () => ({
    meta: [
      { title: "DNS Migration Wizard – liveaskew.com" },
      {
        name: "description",
        content:
          "Step-by-step DNS record changes to move liveaskew.com and www.liveaskew.com to Lovable.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type RecordRow = {
  action: "Add" | "Replace" | "Keep" | "Remove";
  type: string;
  host: string;
  value: string;
  ttl?: string;
  note?: string;
};

const WEB_RECORDS: RecordRow[] = [
  {
    action: "Replace",
    type: "A",
    host: "@",
    value: "185.158.133.1",
    ttl: "3600",
    note: "Root domain → Lovable. Remove any existing A/ALIAS/CNAME on @.",
  },
  {
    action: "Replace",
    type: "A",
    host: "www",
    value: "185.158.133.1",
    ttl: "3600",
    note: "www subdomain → Lovable. Remove any existing A/CNAME on www.",
  },
  {
    action: "Add",
    type: "TXT",
    host: "_lovable",
    value: "lovable_verify=<copy from Lovable Domains panel>",
    ttl: "3600",
    note: "Ownership verification. Exact value shown when you click Connect Domain.",
  },
];

const EMAIL_RECORDS: RecordRow[] = [
  {
    action: "Keep",
    type: "NS",
    host: "notify.www",
    value: "ns3.lovable.cloud / ns4.lovable.cloud",
    note: "Already delegated for outbound auth + app emails. Do not change.",
  },
  {
    action: "Keep",
    type: "MX",
    host: "@",
    value: "(existing inbox provider, e.g. Google/Microsoft)",
    note: "Only touch if the client changes mail providers.",
  },
  {
    action: "Keep",
    type: "TXT",
    host: "@",
    value: "SPF / DMARC records",
    note: "Leave existing SPF + DMARC in place.",
  },
];

const STEPS = [
  {
    title: "Connect the domain in Lovable",
    body: (
      <>
        Open <strong>Project Settings → Domains → Connect Domain</strong>. Add both{" "}
        <code>liveaskew.com</code> and <code>www.liveaskew.com</code>. Set one as
        Primary (the other will 301 to it). Lovable will display the exact{" "}
        <code>_lovable</code> TXT verification value here — copy it for step 3.
      </>
    ),
  },
  {
    title: "Log in to the current DNS provider",
    body: (
      <>
        Go to wherever <code>liveaskew.com</code>'s DNS is managed today (registrar
        or a DNS host like Cloudflare/Route 53). You need access to edit A,
        CNAME, and TXT records on the root zone.
      </>
    ),
  },
  {
    title: "Swap the web records",
    body: (
      <>
        Update the records in the <strong>Web traffic</strong> table below.
        Removing the old A/CNAME for <code>@</code> and <code>www</code> is
        required — leaving them creates a conflict and verification will fail.
      </>
    ),
  },
  {
    title: "Leave email records alone",
    body: (
      <>
        The <strong>Email</strong> table lists what must stay untouched so
        outbound email from <code>notify.www.liveaskew.com</code> and inbound
        mail on <code>@liveaskew.com</code> keep working.
      </>
    ),
  },
  {
    title: "Verify & wait for SSL",
    body: (
      <>
        Back in Lovable → Domains, click <strong>Verify</strong>. Status moves
        Verifying → Setting up → Active. SSL is auto-provisioned. Propagation
        usually takes 5–60 minutes, up to 72 hours worst case.
      </>
    ),
  },
];

function Pill({ action }: { action: RecordRow["action"] }) {
  const styles: Record<RecordRow["action"], string> = {
    Add: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
    Replace: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30",
    Keep: "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/30",
    Remove: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${styles[action]}`}
    >
      {action}
    </span>
  );
}

function RecordTable({ rows }: { rows: RecordRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Action</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Host / Name</th>
            <th className="px-3 py-2">Value</th>
            <th className="px-3 py-2">TTL</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              <td className="px-3 py-2"><Pill action={r.action} /></td>
              <td className="px-3 py-2 font-mono text-xs">{r.type}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.host}</td>
              <td className="px-3 py-2 font-mono text-xs break-all">{r.value}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.ttl ?? "—"}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DnsMigrationWizard() {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const completed = Object.values(done).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            DNS Migration
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Move liveaskew.com to this project
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Follow the 5 steps below. The tables show exactly which records to
            change at the current DNS provider and which to leave alone.
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(completed / STEPS.length) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {completed} of {STEPS.length} steps complete
          </p>
        </header>

        <ol className="space-y-4">
          {STEPS.map((step, i) => (
            <li
              key={i}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!done[i]}
                  onChange={(e) =>
                    setDone((d) => ({ ...d, [i]: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-foreground">
                    Step {i + 1}. {step.title}
                  </h2>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {step.body}
                  </div>
                </div>
              </label>
            </li>
          ))}
        </ol>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">
            Web traffic — change these
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Replace the existing root and www records so the site resolves to
            Lovable. Add the TXT for ownership verification.
          </p>
          <div className="mt-3">
            <RecordTable rows={WEB_RECORDS} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">
            Email — do NOT change
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These keep outbound and inbound email working. Touching them will
            break sending or receiving.
          </p>
          <div className="mt-3">
            <RecordTable rows={EMAIL_RECORDS} />
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <h3 className="font-semibold text-foreground">Common pitfalls</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Leaving the old A/CNAME on <code>@</code> or <code>www</code> —
              Lovable verification will fail until they are removed.
            </li>
            <li>
              Using a CNAME on the root (<code>@</code>) — most DNS providers
              forbid this. Use the A record to <code>185.158.133.1</code>.
            </li>
            <li>
              Cloudflare proxy on: enable “Domain uses Cloudflare or a similar
              proxy” in the Lovable Connect Domain dialog (Advanced section) so
              it issues CNAME-based verification instead.
            </li>
            <li>
              CAA records that exclude Let's Encrypt will block SSL issuance.
            </li>
          </ul>
        </section>

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Internal tool · not indexed
        </footer>
      </div>
    </div>
  );
}
