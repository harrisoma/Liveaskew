import type { SVGProps } from "react";

type MarkProps = SVGProps<SVGSVGElement>;

function Mark({ children, ...props }: MarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22}
      height={22}
      aria-hidden
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function GoogleMark(props: MarkProps) {
  return (
    <Mark {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Mark>
  );
}

export function AppleMark(props: MarkProps) {
  return (
    <Mark fill="currentColor" {...props}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </Mark>
  );
}

export function FacebookMark(props: MarkProps) {
  return (
    <Mark {...props}>
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.87v2.25h3.32l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z"
      />
    </Mark>
  );
}

export function BeeLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/bee-logo-192.png"
      alt=""
      width={192}
      height={192}
      className={`rounded-full ${className}`}
    />
  );
}

export function LiveAskewLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`la-display leading-none font-semibold tracking-tight ${className}`}>
      Live<em className="text-[var(--gold)]">Askew</em>
    </span>
  );
}

export function LiveAskewSignature({ className = "" }: { className?: string }) {
  return (
    <img
      src="/liveaskew-signature.png"
      alt="LiveAskew signature"
      width={866}
      height={1610}
      className={`w-auto object-contain ${className}`}
    />
  );
}

export function BeeByLiveAskew({
  crestClass = "h-20 w-20",
  wordClass = "text-[1.55rem]",
}: {
  crestClass?: string;
  wordClass?: string;
}) {
  return (
    <div className="flex items-center gap-4" aria-label="Bee by LiveAskew">
      <BeeLogo className={`${crestClass} shrink-0`} />
      <div className="flex flex-col items-start gap-1">
        <p className="leading-none">
          <span className="mr-1 text-[0.68rem] font-medium tracking-[0.18em] uppercase opacity-55">
            by
          </span>
          <LiveAskewLogo className={wordClass} />
        </p>
        <LiveAskewSignature className="h-36" />
      </div>
    </div>
  );
}

export function InstagramMark(props: MarkProps) {
  return (
    <Mark {...props}>
      <defs>
        <linearGradient id="ig-camera" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f58529" />
          <stop offset="50%" stopColor="#dd2a7b" />
          <stop offset="100%" stopColor="#8134af" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-camera)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.8" r="1.15" fill="#fff" />
    </Mark>
  );
}
