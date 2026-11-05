import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
beforeEach(() => {
  vi.resetModules();
});
afterEach(() => {
  vi.unstubAllGlobals();
});
describe("subtle interaction audio", () => {
  it("remembers mute and never creates audio while muted", async () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem: () => "off", setItem });
    const AudioContext = vi.fn();
    vi.stubGlobal("window", { AudioContext });
    const sound = await import("./interaction-sound");
    expect(sound.soundEnabled()).toBe(false);
    await sound.playInteractionSound();
    expect(AudioContext).not.toHaveBeenCalled();
    sound.setSoundEnabled(true);
    expect(setItem).toHaveBeenCalledWith("la_interaction_sound_v1", "on");
  });
  it("keeps the setting usable when local storage is blocked", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    const sound = await import("./interaction-sound");
    sound.setSoundEnabled(false);
    expect(sound.soundEnabled()).toBe(false);
  });
  it("uses a short low-gain envelope and throttles rapid taps", async () => {
    vi.stubGlobal("localStorage", { getItem: () => null });
    vi.stubGlobal("document", { visibilityState: "visible" });
    const ramp = vi.fn();
    const stop = vi.fn();
    const createOscillator = vi.fn(() => ({
      type: "",
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop,
      onended: null,
    }));
    class FakeAudioContext {
      state = "running";
      currentTime = 1;
      destination = {};
      createOscillator = createOscillator;
      createGain = () => ({
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: ramp,
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      });
    }
    vi.stubGlobal("window", { AudioContext: FakeAudioContext });
    const sound = await import("./interaction-sound");
    await sound.playInteractionSound();
    await sound.playInteractionSound();
    expect(createOscillator).toHaveBeenCalledTimes(1);
    expect(ramp).toHaveBeenCalledWith(0.018, 1.004);
    expect(stop).toHaveBeenCalledWith(1.06);
  });
});
