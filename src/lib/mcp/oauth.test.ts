import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  authorizationServerMetadata,
  base64Url,
  isAllowedRedirect,
  isValidChallenge,
  isValidVerifier,
  parseAuthorizeRequest,
  protectedResourceMetadata,
  publicOrigin,
  redirectWith,
} from "./oauth";
import { pkceMatches, sha256Hex } from "./oauth.server";

describe("isAllowedRedirect", () => {
  it("allows https and assistant callbacks", () => {
    expect(isAllowedRedirect("https://claude.ai/api/mcp/auth_callback")).toBe(true);
    expect(isAllowedRedirect("https://chatgpt.com/connector_platform_oauth_redirect")).toBe(true);
  });
  it("allows http only on the member's own machine", () => {
    expect(isAllowedRedirect("http://localhost:6274/oauth/callback")).toBe(true);
    expect(isAllowedRedirect("http://127.0.0.1:33418/")).toBe(true);
    expect(isAllowedRedirect("http://evil.example/cb")).toBe(false);
  });
  it("allows app schemes but never script or file URLs", () => {
    expect(isAllowedRedirect("cursor://anysphere.cursor-retrieval/oauth/callback")).toBe(true);
    expect(isAllowedRedirect("javascript:alert(1)")).toBe(false);
    expect(isAllowedRedirect("data:text/html,hi")).toBe(false);
    expect(isAllowedRedirect("file:///etc/passwd")).toBe(false);
  });
  it("rejects fragments and garbage", () => {
    expect(isAllowedRedirect("https://claude.ai/cb#x")).toBe(false);
    expect(isAllowedRedirect("not a url")).toBe(false);
  });
});

describe("PKCE", () => {
  const verifier = "dBjftJeZ4CVP-mJ92K1cQqLZOnwaD-AhkGg4jqbK4LE";
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  it("matches a challenge made the way clients make it", () => {
    expect(pkceMatches(verifier, challenge)).toBe(true);
  });
  it("rejects a wrong verifier", () => {
    expect(pkceMatches(`${verifier.slice(0, -1)}X`, challenge)).toBe(false);
  });
  it("validates shapes", () => {
    expect(isValidVerifier(verifier)).toBe(true);
    expect(isValidVerifier("short")).toBe(false);
    expect(isValidChallenge(challenge)).toBe(true);
    expect(isValidChallenge(`${challenge}=`)).toBe(false);
  });
  it("base64Url matches node's encoding", () => {
    const bytes = new Uint8Array(createHash("sha256").update("x").digest());
    expect(base64Url(bytes)).toBe(Buffer.from(bytes).toString("base64url"));
  });
  it("hashes to hex", () => {
    expect(sha256Hex("abc")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("metadata", () => {
  it("points the resource at its authorization server", () => {
    const m = protectedResourceMetadata("https://www.liveaskew.com");
    expect(m.resource).toBe("https://www.liveaskew.com/api/mcp");
    expect(m.authorization_servers).toEqual(["https://www.liveaskew.com"]);
  });
  it("advertises PKCE S256 and public clients only", () => {
    const m = authorizationServerMetadata("https://www.liveaskew.com");
    expect(m.code_challenge_methods_supported).toEqual(["S256"]);
    expect(m.token_endpoint_auth_methods_supported).toEqual(["none"]);
    expect(m.registration_endpoint).toBe("https://www.liveaskew.com/api/oauth/register");
  });
  it("keeps the host the assistant used, so the issuer matches", () => {
    expect(publicOrigin("https://liveaskew.vercel.app/api/mcp", "https://www.liveaskew.com")).toBe(
      "https://liveaskew.vercel.app",
    );
    expect(publicOrigin("http://internal:3000/api/mcp", "https://www.liveaskew.com/")).toBe(
      "https://www.liveaskew.com",
    );
    expect(publicOrigin("http://localhost:5173/api/mcp", "https://www.liveaskew.com")).toBe(
      "http://localhost:5173",
    );
  });
});

describe("authorize request", () => {
  it("parses the query and defaults the scope", () => {
    const r = parseAuthorizeRequest(
      "?response_type=code&client_id=lac_abc&redirect_uri=https%3A%2F%2Fclaude.ai%2Fcb&code_challenge=c&code_challenge_method=S256&state=s1",
    );
    expect(r).toMatchObject({
      responseType: "code",
      clientId: "lac_abc",
      redirectUri: "https://claude.ai/cb",
      state: "s1",
      scope: "liveaskew",
    });
  });
  it("adds the answer to the redirect and skips empty values", () => {
    const url = redirectWith("https://claude.ai/cb?x=1", { code: "abc", state: null });
    expect(url).toBe("https://claude.ai/cb?x=1&code=abc");
  });
});
