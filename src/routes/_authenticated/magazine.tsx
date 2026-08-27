import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, ArrowLeft, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  generateLookCover,
  listMagazineLooks,
  persistMagazineLooks,
} from "@/lib/bee-styling.functions";
import { submitLookFeedback } from "@/lib/feedback.functions";
import { LookCard } from "@/components/LookCard";
import { loadResolvedTier } from "@/lib/plans";


export const Route = createFileRoute("/_authenticated/magazine")({
  head: () => ({
    meta: [
      { title: "Your Style Magazine — LiveAskew" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: () => listMagazineLooks(),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-2xl font-medium">We couldn't load your magazine.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          className="mt-6 rounded-md border px-4 py-2 text-sm"
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          Try again
        </button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-2xl font-medium">Magazine not found.</h1>
    </div>
  ),
  component: MagazinePage,
});

type CoverPhase = "queued" | "generating" | "done" | "error";
type CoverState = {
  url: string | null;
  phase: CoverPhase;
  error?: string;
};

function extractJsonObject(raw: string): string | null {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function MagazinePage() {
  const { looks } = Route.useLoaderData();
  const router = useRouter();
  const persist = useServerFn(persistMagazineLooks);
  const renderCover = useServerFn(generateLookCover);

  const [busy, setBusy] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [covers, setCovers] = useState<Record<string, CoverState>>({});
  const [tier, setTier] = useState<string | null>(null);
  const sendFeedback = useServerFn(submitLookFeedback);

  useEffect(() => {
    let active = true;
    (async () => {
      const resolved = await loadResolvedTier();
      if (active) setTier(resolved);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Idempotency guard so re-renders / loader invalidations don't re-queue.
  const processedRef = useRef<Set<string>>(new Set());

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    setStreamStatus("Bee is composing your magazine…");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Please sign in again to generate.");

      const res = await fetch("/api/bee/magazine-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: "{}",
      });
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Stream failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let charCount = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        charCount += chunk.length;
        setStreamStatus(`Bee is composing your magazine… (${charCount} chars)`);
      }

      setStreamStatus("Parsing layout…");
      const jsonText = extractJsonObject(accumulated);
      if (!jsonText) throw new Error("Bee returned no parseable JSON.");

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseErr) {
        console.error("magazine JSON parse failed", parseErr, jsonText.slice(0, 400));
        throw new Error("Bee's response wasn't valid JSON.");
      }

      setStreamStatus("Saving looks…");
      const result = await persist({ data: parsed });
      if (result.error) throw new Error(result.error);

      await router.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Magazine generation failed.");
    } finally {
      setBusy(false);
      setStreamStatus(null);
    }
  }


  const renderOne = useCallback(
    async (lookId: string) => {
      setCovers((prev) => ({
        ...prev,
        [lookId]: { url: null, phase: "generating" },
      }));
      try {
        const res = await renderCover({ data: { lookId } });
        setCovers((prev) => ({
          ...prev,
          [lookId]: { url: res.cover_url ?? null, phase: "done" },
        }));
      } catch (err) {
        setCovers((prev) => ({
          ...prev,
          [lookId]: {
            url: null,
            phase: "error",
            error: err instanceof Error ? err.message : "render failed",
          },
        }));
      }
    },
    [renderCover],
  );

  // Sequential queue — process looks strictly one after the other so the
  // serverless infra only ever sees a single in-flight image generation.
  useEffect(() => {
    const pending = looks.filter(
      (l: (typeof looks)[number]) =>
        !l.cover_url && !processedRef.current.has(l.id),
    );
    if (pending.length === 0) return;

    // Seed every pending look as "queued" up front so the UI shows the
    // distinction between waiting in line and actively generating.
    setCovers((prev) => {
      const next = { ...prev };
      for (const l of pending) {
        if (!next[l.id]) next[l.id] = { url: null, phase: "queued" };
      }
      return next;
    });

    let cancelled = false;
    (async () => {
      for (const l of pending) {
        if (cancelled) return;
        if (processedRef.current.has(l.id)) continue;
        processedRef.current.add(l.id);
        await renderOne(l.id);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [looks, renderOne]);

  function handleRetry(lookId: string) {
    processedRef.current.delete(lookId);
    void renderOne(lookId);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <Link
            to="/chat"
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> back to Bee
          </Link>
          <h1 className="text-3xl font-light tracking-tight">your style magazine</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            8 hero looks · curated by Bee for the way you actually live
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm text-background disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Bee is styling…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate this month
            </>
          )}
        </button>
      </div>

      {streamStatus && (
        <div className="mb-4 flex items-center gap-2 rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {streamStatus}
        </div>
      )}

      {error && (
        <div className="mb-8 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}


      {looks.length === 0 ? (
        <div className="rounded-xl border border-dashed px-8 py-20 text-center">
          <p className="text-lg font-light">No issues yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Hit “Generate this month” and Bee will draft your first edition.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {looks.map((look: (typeof looks)[number], index: number) => {
            const c = covers[look.id];
            const url = c?.url ?? look.cover_url ?? null;
            const phase: CoverPhase = url
              ? "done"
              : (c?.phase ?? "queued");
            return (
              <LookCard
                key={look.id}
                number={index + 1}
                occasion={look.occasion ?? "Look"}
                season={look.season ?? "transitional"}
                notes={look.notes?.split("\n\n")[0] ?? ""}
                items={look.items.map((it: (typeof look.items)[number]) => ({
                  brand: it.name ?? "",
                  name: [it.color, it.recommended_fit].filter(Boolean).join(" · "),
                }))}
                imageUrl={url}
                status={phase}
                onRetry={() => handleRetry(look.id)}
                lookId={look.id}
                tier={tier}
                styleMetadata={{
                  occasion: look.occasion,
                  season: look.season,
                  items: look.items,
                }}
                onFeedback={async (args) => {
                  await sendFeedback({
                    data: {
                      look_id: args.lookId,
                      image_url: args.image_url,
                      status: args.status,
                      style_metadata: args.style_metadata,
                    },
                  });
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
