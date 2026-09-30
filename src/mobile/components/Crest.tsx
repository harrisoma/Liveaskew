import beeCrest from "@/assets/brand/crest-bee.webp";
import buzzCrest from "@/assets/brand/crest-buzz.webp";
import hiveCrest from "@/assets/brand/crest-hive.webp";

export type CrestName = "bee" | "honey" | "buzz" | "hive";

const IMAGES: Record<Exclude<CrestName, "honey">, string> = {
  bee: beeCrest,
  buzz: buzzCrest,
  hive: hiveCrest,
};

const LABEL: Record<CrestName, string> = {
  bee: "Bee",
  honey: "Honey",
  buzz: "Buzz",
  hive: "The Hive",
};

/** The four LiveAskew crests — black coins with a gold rim, one per product. */
export function Crest({
  name,
  size = 56,
  decorative = false,
}: {
  name: CrestName;
  size?: number;
  decorative?: boolean;
}) {
  const alt = decorative ? "" : `${LABEL[name]} crest`;
  if (name === "honey") return <HoneyCrest size={size} alt={alt} />;
  return (
    <img
      src={IMAGES[name]}
      alt={alt}
      width={size}
      height={size}
      className="la-crest"
      draggable={false}
    />
  );
}

/** Drawn to match the embossed coins: gold rim, crown, a calendar of honeycomb days. */
function HoneyCrest({ size, alt }: { size: number; alt: string }) {
  const cells: [number, number][] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) cells.push([62 + c * 23 + (r % 2) * 11.5, 104 + r * 20]);
  }
  return (
    <svg
      viewBox="0 0 192 192"
      width={size}
      height={size}
      className="la-crest"
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <defs>
        <linearGradient id="honey-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6d27a" />
          <stop offset="0.5" stopColor="#e2b04a" />
          <stop offset="1" stopColor="#a8761c" />
        </linearGradient>
        <radialGradient id="honey-face" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#2a2a2a" />
          <stop offset="1" stopColor="#0b0b0b" />
        </radialGradient>
      </defs>
      <circle cx="96" cy="96" r="92" fill="url(#honey-rim)" />
      <circle cx="96" cy="96" r="80" fill="url(#honey-face)" />
      <circle cx="96" cy="96" r="80" fill="none" stroke="#6b4a10" strokeWidth="2" opacity="0.6" />
      {/* crown */}
      <path
        d="M78 52 L84 38 L91 48 L96 34 L101 48 L108 38 L114 52 Z"
        fill="url(#honey-rim)"
        stroke="#a8761c"
        strokeWidth="1.5"
      />
      {/* calendar frame */}
      <rect
        x="52"
        y="62"
        width="88"
        height="86"
        rx="12"
        fill="none"
        stroke="url(#honey-rim)"
        strokeWidth="6"
      />
      <path d="M52 86 H140" stroke="url(#honey-rim)" strokeWidth="5" />
      <rect x="70" y="54" width="8" height="18" rx="4" fill="url(#honey-rim)" />
      <rect x="114" y="54" width="8" height="18" rx="4" fill="url(#honey-rim)" />
      {/* honeycomb days */}
      {cells.map(([x, y], i) => (
        <polygon
          key={i}
          points={hexagon(x, y, 8.5)}
          fill={i === 5 ? "url(#honey-rim)" : "none"}
          stroke="url(#honey-rim)"
          strokeWidth="2.4"
        />
      ))}
    </svg>
  );
}

function hexagon(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}
