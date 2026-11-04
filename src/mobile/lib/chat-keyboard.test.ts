import { describe, expect, it } from "vitest";
import { shouldSendChat } from "./chat-keyboard";
const enter = { key: "Enter", shiftKey: false, isComposing: false, keyCode: 13 };
describe("chat keyboard submission", () => {
  it("sends desktop Enter", () => expect(shouldSendChat(enter, true)).toBe(true));
  it("keeps mobile Enter and desktop Shift Enter as newlines", () => {
    expect(shouldSendChat(enter, false)).toBe(false);
    expect(shouldSendChat({ ...enter, shiftKey: true }, true)).toBe(false);
  });
  it("does not submit IME confirmation, including Safari after compositionend", () => {
    expect(shouldSendChat({ ...enter, isComposing: true }, true)).toBe(false);
    expect(shouldSendChat({ ...enter, keyCode: 229 }, true)).toBe(false);
  });
  it("does not submit other keys", () =>
    expect(shouldSendChat({ ...enter, key: "a", keyCode: 65 }, true)).toBe(false));
});
