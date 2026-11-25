/** Eight fictional-client panels in a four-column/two-row sheet. */
export function SampleOutfit({ index, description }: { index: number; description: string }) {
  return (
    <div
      className="lookbook-sample-image"
      role="img"
      aria-label={`AI outfit illustration: ${description}`}
      style={{ backgroundPosition: `${((index % 4) * 100) / 3}% ${Math.floor(index / 4) * 100}%` }}
    />
  );
}
