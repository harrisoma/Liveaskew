import { useEffect, useState } from "react";
import { LIVEASKEW_AD_BRAND, LIVEASKEW_AD_FORMATS, adFrame } from "@/lib/ads/liveaskew";
import { LiveAskewAd } from "./LiveAskewAd";
export function AdFormatsPreview() {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const start = performance.now() - (frame * 1000) / 30;
    let request = 0;
    const tick = (now: number) => {
      const next = adFrame(((now - start) * 30) / 1000).frame;
      setFrame(next);
      if (next >= 449) setPlaying(false);
      else request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
    // The starting frame is captured when playback is explicitly started.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);
  return (
    <main className="la-ad-studio">
      <header>
        <a href="/">LiveAskew</a>
        <h1>Fashion, in motion.</h1>
        <p>Four reusable ad directions. One editorial identity.</p>
      </header>
      <section className="la-ad-controls" aria-label="Preview playback">
        <button
          onClick={() => {
            if (frame === 449) setFrame(0);
            setPlaying(!playing);
          }}
        >
          {playing ? "Pause" : "Play previews"}
        </button>
        <label>
          Timeline{" "}
          <input
            aria-label="Ad timeline"
            type="range"
            min={0}
            max={449}
            value={frame}
            onChange={(e) => {
              setPlaying(false);
              setFrame(Number(e.target.value));
            }}
          />
        </label>
        <output>{(frame / LIVEASKEW_AD_BRAND.fps).toFixed(1)} / 15s</output>
      </section>
      <p className="la-ad-note">
        Fictional sample imagery. Production uses approved fashion assets. This previews layout and
        timing; it does not generate, render or publish an ad.
      </p>
      <div className="la-ad-grid">
        {LIVEASKEW_AD_FORMATS.map((format) => (
          <section key={format.id}>
            <h2>{format.name}</h2>
            <LiveAskewAd
              format={format}
              frame={frame}
              images={format.shots.map((sampleCell) => ({
                src: "/images/style-guide/sample-eight-looks.png",
                alt: "Fictional sample styled outfit",
                sampleCell,
              }))}
            />
            <p>0–3s: hook · 3–11s: fashion edit · 11–15s: invitation</p>
          </section>
        ))}
      </div>
    </main>
  );
}
