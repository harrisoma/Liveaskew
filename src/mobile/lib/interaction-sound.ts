/** Quiet, local-only feedback. No audio downloads, microphone, or network calls. */
const KEY = "la_interaction_sound_v1";
let preference: boolean | undefined;
let context: AudioContext | undefined;
let lastTap = -Infinity;
const listeners = new Set<() => void>();
export function soundEnabled(): boolean {
  if (preference !== undefined) return preference;
  try {
    return (preference = localStorage.getItem(KEY) !== "off");
  } catch {
    return (preference = true);
  }
}
export function setSoundEnabled(enabled: boolean) {
  preference = enabled;
  try {
    localStorage.setItem(KEY, enabled ? "on" : "off");
  } catch {
    /* Session-only preference. */
  }
  listeners.forEach((notify) => notify());
}
export function subscribeSound(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}
export async function playInteractionSound(navigation = false) {
  if (!soundEnabled() || typeof window === "undefined" || document.visibilityState === "hidden")
    return;
  const now = performance.now();
  if (now - lastTap < 90) return;
  lastTap = now;
  try {
    if (!window.AudioContext) return;
    context ??= new window.AudioContext();
    if (context.state === "suspended") await context.resume();
    // Recheck after resume: muting must also silence a pending gesture.
    if (!soundEnabled() || context.state !== "running") return;
    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(navigation ? 620 : 820, start);
    oscillator.frequency.exponentialRampToValueAtTime(navigation ? 460 : 560, start + 0.045);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.018, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.055);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(start + 0.06);
  } catch {
    /* Audio is decorative; never interrupt an action. */
  }
}
