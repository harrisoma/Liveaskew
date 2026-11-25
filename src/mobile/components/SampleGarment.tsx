import { useId } from "react";
/** Fictional sample artwork only. Member guides use their own renders and retailer imagery. */
export function SampleGarment({ index, name }: { index: number; name: string }) {
  const clipId = useId();
  const x = (index % 4) * 362;
  // The source has taller clothing and shorter accessory rows, not equal square cells.
  const row = Math.floor(index / 4);
  const [y, height] = [
    [0, 360],
    [360, 410],
    [785, 290],
  ][row];
  return (
    <svg
      className="sample-garment-image"
      role="img"
      aria-label={`AI-created garment illustration: ${name}`}
      viewBox={`${x} ${y} 362 ${height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width="362" height={height} />
        </clipPath>
      </defs>
      <image
        href="/images/style-guide/sample-capsule.png"
        width="1448"
        height="1086"
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
}
