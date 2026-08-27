import { Link, useRouter } from "@tanstack/react-router";
import { RefreshCcw, Home } from "lucide-react";

type RouteErrorProps = {
  title?: string;
  message?: string;
  error?: Error;
  reset?: () => void;
  showHome?: boolean;
};

export function RouteError({
  title = "Something went askew…",
  message = "We hit an unexpected snag rendering this page. Try again, or head back home — your data is safe.",
  error,
  reset,
  showHome = true,
}: RouteErrorProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          LiveAskew
        </p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>

        {error?.message && (
          <pre className="mt-4 max-h-32 overflow-auto rounded-md bg-muted/60 px-3 py-2 text-left font-mono text-[11px] text-muted-foreground">
            {error.message}
          </pre>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset?.();
            }}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <RefreshCcw size={14} />
            Try again
          </button>
          {showHome && (
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              <Home size={14} />
              Go home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function RouteNotFound() {
  return (
    <RouteError
      title="This page wandered off"
      message="The page you're looking for doesn't exist, was moved, or is no longer available."
      showHome
    />
  );
}

export default RouteError;
