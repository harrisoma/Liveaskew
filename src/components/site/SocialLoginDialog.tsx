import { useEffect, useRef, useState, type FormEvent } from "react";
import { openPlatformLogin, type BuzzPlatformId } from "@/lib/buzz";
import { SocialMarks, type SocialId } from "@/components/site/SocialMarks";

export function SocialLoginDialog({
  platform,
  name,
  initialHandle,
  onClose,
  onAttach,
}: {
  platform: BuzzPlatformId;
  name: string;
  initialHandle: string;
  onClose: () => void;
  onAttach: (handle: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [handle, setHandle] = useState(initialHandle);
  const [opened, setOpened] = useState(false);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!node.open) node.showModal();
    const onCancel = (event: Event) => {
      event.preventDefault();
      closeRef.current();
    };
    node.addEventListener("cancel", onCancel);
    return () => {
      node.removeEventListener("cancel", onCancel);
      if (node.open) node.close();
    };
  }, []);

  function login() {
    const popup = openPlatformLogin(platform);
    setOpened(Boolean(popup));
  }

  function attach(event: FormEvent) {
    event.preventDefault();
    const next = handle.trim();
    if (!next) return;
    onAttach(next);
  }

  return (
    <dialog ref={ref} className="social-login" aria-labelledby="social-login-title">
      <SocialMarks ids={[platform as SocialId]} />
      <h2 id="social-login-title" className="font-display mt-3 text-3xl">
        Log in to {name}
      </h2>
      <p className="mt-2 text-sm leading-relaxed">
        Sign in on {name}. Buzz keeps the handle it should post from. The password stays on {name}.
      </p>
      <button type="button" className="glass-btn mt-4" onClick={login}>
        Log in
      </button>
      {opened && (
        <p className="mt-3 text-sm">
          The {name} window is open. Come back with the handle you signed in as.
        </p>
      )}
      <form onSubmit={attach} className="mt-4 grid gap-3">
        <label className="block text-sm">
          Handle
          <input
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            placeholder="@handle"
            aria-label={`${name} handle`}
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="glass-btn">
            Attach {name}
          </button>
          <button type="button" className="text-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </form>
    </dialog>
  );
}
