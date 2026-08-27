import { useState } from "react";
import { streamImage } from "@/lib/streamImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUGGESTIONS = [
  "Woman in an olive trench coat and white tiered skirt, walking with a yellow handbag, Paris street",
  "Profile of a woman with cropped curls and oversized gold sunglasses, statement earrings",
  "Five figures in black and white evening looks, gestural brushwork on kraft paper",
];

export function IllustrationGenerator() {
  const [prompt, setPrompt] = useState("");
  const [src, setSrc] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(value: string) {
    const text = value.trim();
    if (!text || loading) return;
    setError(null);
    setSrc(null);
    setIsFinal(false);
    setLoading(true);
    try {
      await streamImage("/api/generate-illustration", text, (dataUrl, final) => {
        setSrc(dataUrl);
        if (final) setIsFinal(true);
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("429")) setError("Rate limit reached. Try again in a moment.");
      else if (msg.includes("402")) setError("AI credits exhausted. Add credits in Settings → Plans & credits.");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border hairline bg-bone">
      <div className="p-8 md:p-10 border-b hairline">
        <p className="eyebrow mb-3" style={{ color: "var(--illus-jewel)" }}>
          Live demo · Gemini 3 Pro Image
        </p>
        <h3 className="font-display text-3xl md:text-4xl leading-tight mb-2">
          Generate an illustration in <em>this vibe</em>.
        </h3>
        <p className="text-ink/65 leading-[1.7] text-sm max-w-xl">
          Describe a subject. The system prompt enforces the LiveAskew style —
          loose hand-rendered linework, warm paper background, jewel accents,
          handwritten label beside the figure.
        </p>
      </div>

      <div className="p-8 md:p-10 space-y-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate(prompt);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A woman in a camel coat reading a book on a bench…"
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !prompt.trim()}>
            {loading ? "Drawing…" : "Generate"}
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs tracking-[0.22em] uppercase text-ink/45 mr-1 self-center">Try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setPrompt(s);
                handleGenerate(s);
              }}
              disabled={loading}
              className="text-xs px-3 py-1.5 border hairline rounded-sm bg-cream hover:bg-[color:var(--illus-peach)] transition-colors disabled:opacity-50 text-ink/70 text-left max-w-xs truncate"
              title={s}
            >
              {s.slice(0, 42)}…
            </button>
          ))}
        </div>

        {error && (
          <div className="border border-[color:var(--illus-jewel)]/40 bg-[color:var(--illus-jewel)]/5 text-[color:var(--illus-jewel)] text-sm p-4 rounded-sm">
            {error}
          </div>
        )}

        <div
          className="aspect-square w-full border hairline rounded-sm overflow-hidden flex items-center justify-center"
          style={{ background: "var(--illus-peach)" }}
        >
          {src ? (
            <img
              src={src}
              alt={prompt || "Generated illustration"}
              className={`w-full h-full object-cover transition-[filter] duration-300 ${
                isFinal ? "blur-0" : "blur-2xl"
              }`}
            />
          ) : loading ? (
            <p className="eyebrow text-ink/50 animate-pulse">Composing…</p>
          ) : (
            <p
              className="text-ink/40 text-xl text-center px-8"
              style={{ fontFamily: "var(--font-hand)" }}
            >
              Your sketch will appear here ✦
            </p>
          )}
        </div>

        {src && isFinal && (
          <div className="flex justify-end">
            <a
              href={src}
              download="liveaskew-illustration.png"
              className="eyebrow hover:text-ink transition-colors"
            >
              Download ↓
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
