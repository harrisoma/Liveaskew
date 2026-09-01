export function BeeMark({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <ellipse cx="12" cy="13.5" rx="4.2" ry="5.4" />
      <path d="M8.4 11.5h7.2M8.1 14h7.8M8.6 16.5h6.8" />
      <path d="M12 8.2V6" />
      <circle cx="10.3" cy="5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="13.7" cy="5" r="0.9" fill="currentColor" stroke="none" />
      <path d="M8 9.5c-2.6-1.8-4.6-.6-4.6 1.4 0 2 2.4 2.6 4.6.9M16 9.5c2.6-1.8 4.6-.6 4.6 1.4 0 2-2.4 2.6-4.6.9" />
    </svg>
  );
}
