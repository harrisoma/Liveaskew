import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";



const EXPECTED_NS = ["ns3.lovable.cloud", "ns4.lovable.cloud"];

type DohAnswer = { name: string; type: number; TTL: number; data: string };
type DohResponse = { Status: number; Answer?: DohAnswer[]; Authority?: DohAnswer[] };

async function queryNS(host: string, resolver: "cloudflare" | "google"): Promise<string[]> {
  const url =
    resolver === "cloudflare"
      ? `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=NS`
      : `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=NS`;
  const res = await fetch(url, { headers: { accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`${resolver} DoH ${res.status}`);
  const json = (await res.json()) as DohResponse;
  const records = [...(json.Answer ?? []), ...(json.Authority ?? [])]
    .filter((a) => a.type === 2)
    .map((a) => a.data.replace(/\.$/, "").toLowerCase());
  return Array.from(new Set(records));
}

export const checkEmailNsDelegation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])

  .inputValidator((data: { host: string }) => {
    if (!data?.host || !/^[a-z0-9.-]+$/i.test(data.host)) {
      throw new Error("Invalid host");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const host = data.host.toLowerCase();
    const [cloudflare, google] = await Promise.allSettled([
      queryNS(host, "cloudflare"),
      queryNS(host, "google"),
    ]);

    const result = (r: PromiseSettledResult<string[]>) =>
      r.status === "fulfilled"
        ? { ok: true as const, ns: r.value }
        : { ok: false as const, error: r.reason instanceof Error ? r.reason.message : String(r.reason) };

    const cf = result(cloudflare);
    const g = result(google);

    const allNs = Array.from(
      new Set([...(cf.ok ? cf.ns : []), ...(g.ok ? g.ns : [])]),
    );

    const expected = EXPECTED_NS.map((n) => n.toLowerCase());
    const matched = expected.filter((e) => allNs.includes(e));
    const missing = expected.filter((e) => !allNs.includes(e));
    const verified = missing.length === 0 && allNs.length > 0;

    return {
      host,
      expected,
      observed: allNs,
      matched,
      missing,
      verified,
      resolvers: { cloudflare: cf, google: g },
      checkedAt: new Date().toISOString(),
    };
  });
