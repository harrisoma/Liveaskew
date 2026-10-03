import { describe, expect, it, vi } from "vitest";
import { INVALID_PARAMS, METHOD_NOT_FOUND, handleBody, handleMessage } from "./protocol";
import { MCP_TOOLS, toolText } from "./tools";

const ctx = {
  callTool: vi.fn(async (name: string) => (name === "get_today" ? toolText("hi") : null)),
};

describe("MCP protocol", () => {
  it("initializes with a supported version", async () => {
    const r = await handleMessage(
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } },
      ctx,
    );
    expect(r).toMatchObject({
      id: 1,
      result: { protocolVersion: "2025-03-26", serverInfo: { name: "liveaskew" } },
    });
  });
  it("falls back to the latest version for unknown ones", async () => {
    const r = await handleMessage(
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "1999-01-01" } },
      ctx,
    );
    expect(r).toMatchObject({ result: { protocolVersion: "2025-06-18" } });
  });
  it("lists the tools", async () => {
    const r = await handleMessage({ jsonrpc: "2.0", id: "a", method: "tools/list" }, ctx);
    expect(r).toMatchObject({ result: { tools: MCP_TOOLS } });
    expect(MCP_TOOLS.map((t) => t.name)).toEqual([
      "get_today",
      "list_looks",
      "get_calendar",
      "ask_bee",
    ]);
  });
  it("calls a tool", async () => {
    const r = await handleMessage(
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "get_today", arguments: {} } },
      ctx,
    );
    expect(r).toMatchObject({ id: 2, result: { content: [{ type: "text", text: "hi" }] } });
  });
  it("rejects an unknown tool and method", async () => {
    const unknownTool = await handleMessage(
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "nope" } },
      ctx,
    );
    expect(unknownTool).toMatchObject({ error: { code: INVALID_PARAMS } });
    const unknownMethod = await handleMessage({ jsonrpc: "2.0", id: 4, method: "x/y" }, ctx);
    expect(unknownMethod).toMatchObject({ error: { code: METHOD_NOT_FOUND } });
  });
  it("answers nothing to notifications", async () => {
    expect(
      await handleBody({ jsonrpc: "2.0", method: "notifications/initialized" }, ctx),
    ).toBeNull();
  });
  it("handles a batch", async () => {
    const out = await handleBody(
      [
        { jsonrpc: "2.0", id: 1, method: "ping" },
        { jsonrpc: "2.0", method: "notifications/initialized" },
      ],
      ctx,
    );
    expect(out).toEqual([{ jsonrpc: "2.0", id: 1, result: {} }]);
  });
});
