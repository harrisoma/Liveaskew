import { motion, type Transition, useAnimationFrame } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import orbVideo from "@/assets/bee-orb-woven.mp4.asset.json";

/**
 * BeeOrb — Bee's reactive presence.
 *
 * A woven gold/silver silk-thread sphere with a cream glowing core. The orb
 * body is a looping video texture; the halo, motes, specular and state
 * choreography are layered SVG on top so Bee can breathe, listen, think,
 * speak and "present" (bloom outward then gather).
 */

export type BeeOrbState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "presenting";
export type BeeOrbSurface = "light" | "dark" | "auto";

interface BeeOrbProps {
  state?: BeeOrbState;
  size?: number;
  surface?: BeeOrbSurface;
  minimal?: boolean;
  showOuterGlow?: boolean;
  palette?: string[];
  className?: string;
  ariaLabel?: string;
}

const GOLD = "#C9A84C";
const GOLD_DEEP = "#9A7E2E";
const GOLD_SOFT = "#E6CD86";
const CREAM = "#FAFAF7";
const SILVER = "#E4E4EA";

function usePaletteBlend(palette: string[] | undefined) {
  const target = useMemo(() => {
    const p = (palette ?? []).filter(Boolean).slice(0, 4);
    return {
      core: p[0] ?? GOLD_SOFT,
      highlight: p[1] ?? p[0] ?? GOLD,
      aura: p[2] ?? p[0] ?? GOLD,
      strength: p.length > 0 ? 1 : 0,
    };
  }, [palette]);

  const [blend, setBlend] = useState(target);
  const fromRef = useRef(target);
  const toRef = useRef(target);
  const t0Ref = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = blend;
    toRef.current = target;
    t0Ref.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  useAnimationFrame((time) => {
    if (t0Ref.current === null) t0Ref.current = time;
    const dur = 1400;
    const k = Math.min(1, (time - t0Ref.current) / dur);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const f = fromRef.current;
    const tg = toRef.current;
    setBlend({
      core: mixHex(f.core, tg.core, e),
      highlight: mixHex(f.highlight, tg.highlight, e),
      aura: mixHex(f.aura, tg.aura, e),
      strength: f.strength + (tg.strength - f.strength) * e,
    });
  });

  return blend;
}
function mixHex(a: string, b: string, t: number) {
  const pa = toRgb(a);
  const pb = toRgb(b);
  return `rgb(${Math.round(pa[0] + (pb[0] - pa[0]) * t)}, ${Math.round(
    pa[1] + (pb[1] - pa[1]) * t,
  )}, ${Math.round(pa[2] + (pb[2] - pa[2]) * t)})`;
}
function toRgb(c: string): [number, number, number] {
  if (c.startsWith("rgb")) {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(",").map((v) => parseFloat(v));
      return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];
    }
  }
  const h = c.replace("#", "");
  const s = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

export function BeeOrb({
  state = "idle",
  size = 240,
  surface = "light",
  minimal = false,
  showOuterGlow = true,
  palette,
  className,
  ariaLabel = "Bee",
}: BeeOrbProps) {
  const isDark = surface === "dark";
  const blend = usePaletteBlend(palette);
  const videoRef = useRef<HTMLVideoElement>(null);

  // presenting: bloom outward, hold, gather, settle
  const [bloom, setBloom] = useState(0);
  useEffect(() => {
    if (state !== "presenting") {
      setBloom(0);
      return;
    }
    setBloom(1);
    const t = setTimeout(() => setBloom(0), 1800);
    return () => clearTimeout(t);
  }, [state]);

  // nudge video playback rate by state (subtle)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const rate =
      state === "speaking"
        ? 1.35
        : state === "thinking"
          ? 1.15
          : state === "presenting"
            ? 1.5
            : state === "listening"
              ? 1.0
              : 0.85;
    v.playbackRate = rate;
  }, [state]);

  const breath = useMemo(() => {
    switch (state) {
      case "listening":
        return { scale: [1, 1.03, 1], dur: 2 };
      case "thinking":
        return { scale: [1, 1.015, 0.99, 1.02, 1], dur: 1.3 };
      case "speaking":
        return { scale: [1, 1.06, 0.99, 1.04, 1], dur: 0.85 };
      case "presenting":
        return { scale: [1, 1.08, 1.03, 1], dur: 2.6 };
      default:
        return { scale: [1, 1.025, 1], dur: 5.5 };
    }
  }, [state]);

  const breathT: Transition = {
    duration: breath.dur,
    repeat: Infinity,
    ease: "easeInOut",
  };

  const glowPulse =
    state === "speaking"
      ? [0.7, 1, 0.7]
      : state === "listening"
        ? [0.65, 0.95, 0.65]
        : state === "thinking"
          ? [0.6, 0.9, 0.6]
          : state === "presenting"
            ? [0.85, 1, 0.9]
            : [0.6, 0.85, 0.6];
  const glowDur =
    state === "speaking"
      ? 0.85
      : state === "listening"
        ? 2
        : state === "thinking"
          ? 1.3
          : state === "presenting"
            ? 2.6
            : 5.5;

  const highlightCol = blend.highlight;
  const auraCol = blend.aura;

  const MOTES = minimal ? 0 : 16;

  // palette overlay strength — tints the video softly when palette is set
  const tintOpacity = blend.strength * (isDark ? 0.32 : 0.22);

  // bloom transform: when "presenting", orb scales out slightly and halo expands
  const bloomScale = 1 + bloom * 0.06;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-block",
      }}
    >
      {/* Outer halo — soft warm glow that pulses with state */}
      {showOuterGlow && (
        <motion.div
          aria-hidden
          style={{
            position: "absolute",
            inset: "-18%",
            borderRadius: "50%",
            background: `radial-gradient(circle at 50% 50%, ${auraCol} 0%, ${auraCol}00 60%)`,
            filter: "blur(14px)",
            pointerEvents: "none",
          }}
          animate={{ opacity: glowPulse, scale: [1, 1.04 + bloom * 0.08, 1] }}
          transition={{ duration: glowDur, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Cream core glow — sits behind the woven sphere */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          inset: "8%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 50% 50%, ${CREAM} 0%, ${CREAM}cc 35%, ${highlightCol}55 70%, transparent 100%)`,
          filter: "blur(6px)",
          pointerEvents: "none",
        }}
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: glowDur * 0.9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Woven silk-thread sphere — looping video, circular-masked */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          overflow: "hidden",
          // crop out the reference video's outer smoke ribbons by zooming in
          // so only the woven sphere itself is visible
          maskImage:
            "radial-gradient(circle at 50% 50%, #000 58%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 50%, #000 58%, transparent 72%)",
        }}
        animate={{ scale: breath.scale.map((s) => s * bloomScale) }}
        transition={breathT}
      >
        <video
          ref={videoRef}
          src={orbVideo.url}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            // zoom in slightly so the woven ball fills the circle and the
            // smoke ribbons from the source are pushed offscreen
            transform: "scale(1.35)",
            transformOrigin: "center",
          }}
        />
        {/* palette tint — smoothly cross-fades when Bee discusses a look */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, ${highlightCol}, transparent 75%)`,
            opacity: tintOpacity,
            mixBlendMode: "soft-light",
            transition: "opacity 600ms ease",
            pointerEvents: "none",
          }}
        />
        {/* subtle inner shadow ring for depth */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            boxShadow: `inset 0 0 30px ${GOLD_DEEP}55, inset 0 0 60px ${CREAM}33`,
            pointerEvents: "none",
          }}
        />
      </motion.div>

      {/* Specular cream highlight */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "16%",
          left: "22%",
          width: "26%",
          height: "16%",
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${CREAM}e6 0%, transparent 70%)`,
          filter: "blur(4px)",
          pointerEvents: "none",
        }}
      />

      {/* Motes — drifting gold dust */}
      {!minimal && (
        <motion.svg
          viewBox="0 0 200 200"
          width={size}
          height={size}
          style={{
            position: "absolute",
            inset: 0,
            overflow: "visible",
            pointerEvents: "none",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          <defs>
            <radialGradient id="beeMote" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={CREAM} stopOpacity="1" />
              <stop offset="55%" stopColor={highlightCol} stopOpacity="0.7" />
              <stop offset="100%" stopColor={highlightCol} stopOpacity="0" />
            </radialGradient>
          </defs>
          {Array.from({ length: MOTES }).map((_, i) => {
            const a = (i / MOTES) * Math.PI * 2 + (i % 3) * 0.4;
            const baseR = 78 + ((i * 7) % 18);
            const r = baseR + bloom * 24;
            const x = 100 + Math.cos(a) * r;
            const y = 100 + Math.sin(a) * r;
            const rad = 0.9 + ((i * 3) % 5) * 0.45;
            return (
              <motion.circle
                key={`m-${i}`}
                cx={x}
                cy={y}
                r={rad}
                fill="url(#beeMote)"
                animate={{ opacity: [0.25, 0.95, 0.25] }}
                transition={{
                  duration: 2.4 + (i % 5) * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: (i % 9) * 0.22,
                }}
              />
            );
          })}
        </motion.svg>
      )}
    </div>
  );
}
