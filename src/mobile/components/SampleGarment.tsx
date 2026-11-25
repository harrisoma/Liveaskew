/** Fictional sample artwork only. Member guides use their own renders and retailer imagery. */
export function SampleGarment({ index, name }: { index: number; name: string }) {
  return (
    <div
      className="sample-garment-image"
      role="img"
      aria-label={`AI-created garment illustration: ${name}`}
      style={{ backgroundPosition: `${((index % 4) * 100) / 3}% ${Math.floor(index / 4) * 50}%` }}
    />
  );
}
