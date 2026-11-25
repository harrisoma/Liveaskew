/** Fictional sample artwork only. Member guides use their own renders and retailer imagery. */
export function SampleGarment({ index, name }: { index: number; name: string }) {
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
      viewBox={`${(index % 4) * 362} ${y} 362 ${height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <image href="/images/style-guide/sample-capsule.png" width="1448" height="1086" />
    </svg>
  );
}
