import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`neo-shimmer ${className}`} aria-hidden />;
}

export function NeoButton({
  variant = "raised",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "raised" | "gold" | "ink" }) {
  const extra = variant === "gold" ? "neo-btn-gold" : variant === "ink" ? "neo-btn-ink" : "";
  return <button type="button" className={`neo-btn ${extra} ${className}`} {...props} />;
}

export function NeoField({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`neo-input ${className}`} {...props} />;
}

export function Screen({
  kicker,
  title,
  children,
  footer,
}: {
  kicker?: string;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-3">
        {kicker && <p className="la-kicker">{kicker}</p>}
        {title && (
          <h1 className="la-display mt-1 text-[2.125rem] leading-[1.1] font-bold">{title}</h1>
        )}
        <div className={title ? "mt-5" : ""}>{children}</div>
      </div>
      {footer && <div className="shrink-0 px-5 pt-2 pb-3">{footer}</div>}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="la-segmented grid auto-cols-fr grid-flow-col gap-0.5 p-0.5"
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className="px-2 py-1.5 text-[13px] font-semibold"
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
