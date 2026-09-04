import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Lock, Trash2, Upload, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  clearFamilySelfie,
  clearPrimarySelfie,
  getSelfieSignedUrl,
  setFamilySelfie,
  setPrimarySelfie,
} from "@/lib/selfies.functions";
import { pickNativeSelfieFile } from "@/lib/native-camera";
import { hasEntitlement } from "@/lib/plans";

type Scope = { kind: "primary" } | { kind: "family"; id: string };

interface Props {
  scope: Scope;
  tier: string | null;
  label: string;
  sublabel?: string;
  path: string | null;
  onChange?: (path: string | null) => void;
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const MIN_DIM = 512;
const MAX_DIM = 4096;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 800;

class UploadAbortedError extends Error {
  constructor() {
    super("Upload canceled");
    this.name = "UploadAbortedError";
  }
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions."));
    };
    img.src = url;
  });
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new UploadAbortedError());
    const t = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new UploadAbortedError());
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

interface UploadAttemptOptions {
  bucket: string;
  path: string;
  file: File;
  token: string;
  signal: AbortSignal;
  onProgress: (pct: number) => void;
}

function uploadAttempt({
  bucket,
  path,
  file,
  token,
  signal,
  onProgress,
}: UploadAttemptOptions): Promise<void> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${baseUrl}/storage/v1/object/${bucket}/${path}`;

  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new UploadAbortedError());

    const xhr = new XMLHttpRequest();
    let settled = false;

    const onAbort = () => {
      if (settled) return;
      settled = true;
      try {
        xhr.abort();
      } catch {
        /* ignore */
      }
      reject(new UploadAbortedError());
    };
    signal.addEventListener("abort", onAbort, { once: true });

    const cleanup = () => {
      signal.removeEventListener("abort", onAbort);
    };

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (settled) return;
      settled = true;
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        let msg = `Upload failed: ${xhr.status}`;
        try {
          const body = JSON.parse(xhr.responseText);
          msg = body.message || body.error || msg;
        } catch {
          msg = xhr.statusText || msg;
        }
        const err = new Error(msg) as Error & { status?: number };
        err.status = xhr.status;
        reject(err);
      }
    });

    xhr.addEventListener("error", () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new UploadAbortedError());
    });

    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

function isRetryable(err: unknown): boolean {
  if (err instanceof UploadAbortedError) return false;
  const e = err as { status?: number; message?: string };
  // Network errors have no status. Retry 5xx and 408/429.
  if (typeof e?.status !== "number") return true;
  return e.status >= 500 || e.status === 408 || e.status === 429;
}

interface UploadWithRetryOptions {
  bucket: string;
  path: string;
  file: File;
  token: string;
  signal: AbortSignal;
  onProgress: (pct: number) => void;
  onAttempt?: (attempt: number) => void;
}

async function uploadWithRetry(opts: UploadWithRetryOptions): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    opts.onAttempt?.(attempt);
    // Reset progress for each attempt so the bar reflects actual bytes sent.
    opts.onProgress(0);
    try {
      await uploadAttempt({
        bucket: opts.bucket,
        path: opts.path,
        file: opts.file,
        token: opts.token,
        signal: opts.signal,
        onProgress: opts.onProgress,
      });
      return;
    } catch (err) {
      lastErr = err;
      if (err instanceof UploadAbortedError) throw err;
      if (attempt >= MAX_RETRIES || !isRetryable(err)) throw err;
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      await sleep(delay, opts.signal);
    }
  }
  throw lastErr ?? new Error("Upload failed");
}

export function SelfieUploader({ scope, tier, label, sublabel, path, onChange }: Props) {
  const allowed = hasEntitlement(tier, "selfieAI");
  const sign = useServerFn(getSelfieSignedUrl);
  const setPrimary = useServerFn(setPrimarySelfie);
  const setFamily = useServerFn(setFamilySelfie);
  const clearPrimary = useServerFn(clearPrimarySelfie);
  const clearFamily = useServerFn(clearFamilySelfie);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [attempt, setAttempt] = useState(1);

  useEffect(() => {
    let on = true;
    if (!path) {
      setUrl(null);
      return;
    }
    sign({ data: { path } })
      .then((r) => {
        if (on) setUrl(r.url);
      })
      .catch(() => {
        if (on) setUrl(null);
      });
    return () => {
      on = false;
    };
  }, [path, sign]);

  useEffect(() => {
    return () => {
      // Cancel any in-flight upload on unmount.
      abortRef.current?.abort();
    };
  }, []);

  function handleCancel() {
    abortRef.current?.abort();
  }

  async function handlePick() {
    setError(null);
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        const native = await pickNativeSelfieFile();
        if (native) await handleFile(native);
        return;
      }
    } catch {
      return;
    }
    inputRef.current?.click();
  }

  async function handleFile(file: File) {
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Use a JPG, PNG, WEBP, or HEIC photo.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Photo must be under 8MB.");
      return;
    }

    if (file.type !== "image/heic" && file.type !== "image/heif") {
      try {
        const dims = await getImageDimensions(file);
        if (dims.width < MIN_DIM || dims.height < MIN_DIM) {
          setError(`Image is too small. Must be at least ${MIN_DIM}×${MIN_DIM} pixels.`);
          return;
        }
        if (dims.width > MAX_DIM || dims.height > MAX_DIM) {
          setError(`Image is too large. Must be no more than ${MAX_DIM}×${MAX_DIM} pixels.`);
          return;
        }
      } catch {
        // ignore dimension read failure on standard formats
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setProgress(0);
    setAttempt(1);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const folder = scope.kind === "primary" ? "primary" : `family/${scope.id}`;
      const objectPath = `${u.user.id}/${folder}/${crypto.randomUUID()}.${ext}`;

      await uploadWithRetry({
        bucket: "selfies",
        path: objectPath,
        file,
        token,
        signal: controller.signal,
        onProgress: (pct) => setProgress(pct),
        onAttempt: (n) => setAttempt(n),
      });

      if (scope.kind === "primary") {
        await setPrimary({ data: { path: objectPath } });
      } else {
        await setFamily({ data: { id: scope.id, path: objectPath } });
      }
      onChange?.(objectPath);
    } catch (e) {
      if (e instanceof UploadAbortedError) {
        setError("Upload canceled.");
      } else {
        setError(e instanceof Error ? e.message : "Upload failed.");
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
      setProgress(0);
      setAttempt(1);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!path) return;
    if (!confirm("Remove this selfie?")) return;
    setBusy(true);
    setError(null);
    try {
      if (scope.kind === "primary") await clearPrimary();
      else await clearFamily({ data: { id: scope.id } });
      onChange?.(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove.");
    } finally {
      setBusy(false);
    }
  }

  if (!allowed) {
    return (
      <div className="border border-dashed border-[var(--gold-soft)] bg-bone/60 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-16 w-16 place-items-center border border-ink/10 bg-cream text-ink/35">
            <Lock size={16} />
          </div>
          <div className="flex-1">
            <p className="text-[0.6rem] uppercase tracking-[0.22em] text-gold-deep">
              Selfie AI · Gold
            </p>
            <p className="font-display mt-1 text-base">{label}</p>
            <p className="mt-1 text-xs text-ink/55">
              Upgrade to Gold to see yourself in every look.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[var(--gold-soft)] bg-bone p-4">
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-ink/15 bg-cream">
          {url ? (
            <img src={url} alt={`${label} selfie`} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-ink/30">
              <Camera size={18} />
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-ink/50 backdrop-blur-[1px]">
              {progress > 0 || attempt > 1 ? (
                <div className="w-14 text-center">
                  <span className="block text-[10px] font-mono text-gold-deep mb-1.5">
                    {progress < 100 ? `${progress}%` : "Processing"}
                  </span>
                  <div className="h-[2px] w-full bg-ink/30 overflow-hidden">
                    <div
                      className="h-full bg-gold-deep transition-[width] duration-150 ease-out"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  {attempt > 1 && (
                    <span className="block mt-1 text-[9px] uppercase tracking-[0.18em] text-cream/80">
                      Retry {attempt}/{MAX_RETRIES}
                    </span>
                  )}
                </div>
              ) : (
                <Loader2 size={16} className="animate-spin text-cream" />
              )}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-[0.6rem] uppercase tracking-[0.22em] text-gold-deep">Selfie AI</p>
          <p className="font-display mt-1 text-base">{label}</p>
          {sublabel && <p className="text-xs text-ink/55">{sublabel}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handlePick()}
              className="inline-flex items-center gap-2 border border-ink/20 bg-cream px-3 py-2 text-[0.6rem] uppercase tracking-[0.22em] text-ink transition hover:border-gold-deep hover:text-gold-deep disabled:opacity-40"
            >
              <Upload size={11} />
              {path ? "Replace" : "Upload selfie"}
            </button>
            {busy && abortRef.current && (
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-2 border border-ink/20 px-3 py-2 text-[0.6rem] uppercase tracking-[0.22em] text-ink transition hover:border-destructive hover:text-destructive"
              >
                <X size={11} />
                Cancel
              </button>
            )}
            {!busy && path && (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-2 border border-ink/15 px-3 py-2 text-[0.6rem] uppercase tracking-[0.22em] text-ink/60 transition hover:bg-destructive hover:text-cream hover:border-destructive"
              >
                <Trash2 size={11} />
                Remove
              </button>
            )}
          </div>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          <p className="mt-2 text-[0.65rem] text-ink/40">
            Clear face, neutral light. JPG/PNG/WEBP/HEIC, up to 8MB,
            {MIN_DIM}–{MAX_DIM}px. Used only to generate lookbook imagery on your likeness.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
