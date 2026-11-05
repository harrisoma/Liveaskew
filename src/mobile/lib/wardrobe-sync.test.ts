import { describe, it, expect } from "vitest";
import { wardrobeRowId, wardrobeMobileId } from "./wardrobe-sync";
describe("wardrobe account identity", () => {
  it("keeps retries stable and different accounts isolated", async () => {
    const id = await wardrobeRowId("user1", "piece");
    expect(id).toBe(await wardrobeRowId("user1", "piece"));
    expect(id).not.toBe(await wardrobeRowId("user2", "piece"));
    expect(id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-a[a-f0-9]{3}-[a-f0-9]{12}$/);
  });
  it("only restores IDs from known reset metadata", () => {
    expect(wardrobeMobileId('{"source":"bee-reset","mobileId":"w1"}', "db")).toBe("w1");
    expect(wardrobeMobileId('{"mobileId":"w1"}', "db")).toBe("db");
    expect(wardrobeMobileId("broken", "db")).toBe("db");
  });
});
