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
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-3">
        {kicker && <p className="la-kicker">{kicker}</p>}
        {title && (
          <h1 className="la-display mt-2 text-[1.75rem] leading-tight font-semibold">{title}</h1>
        )}
        <div className={title ? "mt-5" : ""}>{children}</div>
      </div>
      {footer && <div className="shrink-0 px-5 pt-2 pb-3">{footer}</div>}
    </div>
  );
}
