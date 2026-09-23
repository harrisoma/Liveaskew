import { describe, expect, it } from "vitest";
import { dataUrlToFile } from "./native-camera";

describe("dataUrlToFile", () => {
  it("preserves bytes and mime — no resize or beautify", () => {
    const raw = Uint8Array.from([1, 2, 3, 4, 5]);
    let binary = "";
    raw.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    const dataUrl = `data:image/jpeg;base64,${btoa(binary)}`;
    const file = dataUrlToFile(dataUrl, "selfie.jpg");
    expect(file.type).toBe("image/jpeg");
    expect(file.name).toBe("selfie.jpg");
    expect(file.size).toBe(5);
  });
});
