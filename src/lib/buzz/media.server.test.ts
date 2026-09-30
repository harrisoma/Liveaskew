import { describe, expect, it } from "vitest";
import { isOwnBuzzMedia } from "./media.server";

const SB = "https://abc.supabase.co";
const U = "11111111-1111-1111-1111-111111111111";
const own = `${SB}/storage/v1/object/public/buzz-media/${U}/p.jpg`;

describe("isOwnBuzzMedia", () => {
  it("accepts only the member's own buzz-media files", () => {
    expect(isOwnBuzzMedia(own, U, SB)).toBe(true);
    expect(isOwnBuzzMedia(own.replace(U, "22222222-2222-2222-2222-222222222222"), U, SB)).toBe(
      false,
    );
    expect(
      isOwnBuzzMedia(`${SB}/storage/v1/object/public/buzz-media/${U}/../other/p.jpg`, U, SB),
    ).toBe(false);
    expect(isOwnBuzzMedia(`${SB}/storage/v1/object/public/buzz-media/${U}/%2e%2e/x`, U, SB)).toBe(
      false,
    );
    expect(isOwnBuzzMedia("http://169.254.169.254/latest/meta-data", U, SB)).toBe(false);
    expect(
      isOwnBuzzMedia(`https://evil.com/storage/v1/object/public/buzz-media/${U}/p.jpg`, U, SB),
    ).toBe(false);
    expect(isOwnBuzzMedia(`${own}?redirect=1`, U, SB)).toBe(false);
    expect(isOwnBuzzMedia(null, U, SB)).toBe(false);
  });
});
