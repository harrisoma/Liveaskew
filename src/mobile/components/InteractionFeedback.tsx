import { useEffect, useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  playInteractionSound,
  setSoundEnabled,
  soundEnabled,
  subscribeSound,
} from "../lib/interaction-sound";

export function useInteractionFeedback() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!event.isTrusted || !(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>(".la-app button");
      if (
        !button ||
        button.disabled ||
        button.getAttribute("aria-disabled") === "true" ||
        button.dataset.uiSound === "off"
      )
        return;
      void playInteractionSound(
        button.getAttribute("role") === "tab" || Boolean(button.closest(".la-tabbar")),
      );
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
}
export function SoundControl() {
  const enabled = useSyncExternalStore(subscribeSound, soundEnabled, () => false);
  return (
    <button
      type="button"
      className="neo-icon-btn la-sound-control"
      data-ui-sound="off"
      aria-label="Subtle interface sounds"
      aria-pressed={enabled}
      title={enabled ? "Mute interface sounds" : "Enable quiet interface sounds"}
      onClick={() => {
        setSoundEnabled(!enabled);
        if (!enabled) void playInteractionSound();
      }}
    >
      {enabled ? <Volume2 size={17} aria-hidden /> : <VolumeX size={17} aria-hidden />}
    </button>
  );
}
