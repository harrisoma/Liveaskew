import { describe, expect, it } from "vitest";
import { signalCommand, safeSignalAuthorization, signalSummary } from "./signal-contract";
describe("Signal member contract", () => {
  it("never forwards a caller's owner, member, or profile identity", () => {
    expect(
      signalCommand({
        action: "connect",
        provider: "meta",
        client_id: "other",
        signal_profile_id: "other",
        member_id: "other",
      }),
    ).toEqual({ endpoint: "native-social-connect-start", body: { provider: "meta" } });
  });
  it("rejects unsupported actions and malformed asset selections", () => {
    expect(() => signalCommand({ action: "publish" })).toThrow();
    expect(() => signalCommand({ action: "select", connectionId: "x", assetIds: ["x"] })).toThrow();
  });
  it("allows only HTTPS provider destinations", () => {
    expect(safeSignalAuthorization("https://www.facebook.com/dialog/oauth?state=abc")).toBeTruthy();
    for (const value of [
      "javascript:alert(1)",
      "https://evil.example",
      "https://www.facebook.com.evil.example",
      "https://secret@www.facebook.com/",
      "http://www.facebook.com/",
    ])
      expect(safeSignalAuthorization(value)).toBeNull();
  });
  it("strips provider credentials from summary responses", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const result = signalSummary.parse({
      connections: [
        { id, provider: "meta", status: "connected", access_token: "secret", assets: [] },
      ],
    });
    expect(JSON.stringify(result)).not.toContain("secret");
  });
});
