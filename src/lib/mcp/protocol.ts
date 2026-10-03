import { MCP_TOOLS, type ToolResult } from "./tools";

/**
 * The Model Context Protocol over Streamable HTTP, stateless: every POST carries one
 * JSON-RPC message (or, for older clients, a batch) and gets JSON back. No I/O here —
 * tool calls go through the `callTool` the route passes in.
 */

export const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26"] as const;
export const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0];

export const SERVER_INFO = { name: "liveaskew", title: "LiveAskew", version: "1.0.0" };

export const INSTRUCTIONS =
  "LiveAskew is the member's personal styling studio: Bee (her stylist), Honey (her calendar), and her saved looks. Call get_today when she asks what to wear or about her day. Let Bee's answers stand in Bee's voice. Clothes follow the body she has — never suggest slimming, reshaping, or beautifying her.";

type Id = string | number | null;
export type JsonRpcRequest = { jsonrpc: "2.0"; id?: Id; method: string; params?: unknown };
export type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: Id; result: unknown }
  | { jsonrpc: "2.0"; id: Id; error: { code: number; message: string; data?: unknown } };

export const PARSE_ERROR = -32700;
export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;
export const INTERNAL_ERROR = -32603;

export type RpcContext = {
  callTool: (name: string, args: Record<string, unknown>) => Promise<ToolResult | null>;
};

function fail(id: Id, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function negotiateVersion(requested: unknown): string {
  return (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(requested as string)
    ? (requested as string)
    : LATEST_PROTOCOL_VERSION;
}

/** One message in, one response out — or null for a notification, which gets none. */
export async function handleMessage(
  message: unknown,
  ctx: RpcContext,
): Promise<JsonRpcResponse | null> {
  if (!isObject(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    // A client's response to us (we never send requests) needs no answer.
    if (isObject(message) && ("result" in message || "error" in message)) return null;
    const id = isObject(message) && isId(message.id) ? message.id : null;
    return fail(id, INVALID_REQUEST, "Invalid request");
  }
  const isNotification = !("id" in message);
  const id: Id = isId(message.id) ? message.id : null;
  const params = isObject(message.params) ? message.params : {};

  if (isNotification) return null; // notifications/initialized, cancelled, …

  switch (message.method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: negotiateVersion(params.protocolVersion),
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS,
        },
      };
    case "ping":
      return { jsonrpc: "2.0", id, result: {} };
    case "tools/list":
      return { jsonrpc: "2.0", id, result: { tools: MCP_TOOLS } };
    case "tools/call": {
      const name = params.name;
      const args = params.arguments ?? {};
      if (typeof name !== "string" || !isObject(args)) {
        return fail(id, INVALID_PARAMS, "tools/call needs a name and an arguments object");
      }
      try {
        const result = await ctx.callTool(name, args);
        if (!result) return fail(id, INVALID_PARAMS, `Unknown tool: ${name}`);
        return { jsonrpc: "2.0", id, result };
      } catch (err) {
        console.error("[mcp] tool failed", name, err);
        return fail(id, INTERNAL_ERROR, "The tool failed. Try again in a moment.");
      }
    }
    case "resources/list":
      return { jsonrpc: "2.0", id, result: { resources: [] } };
    case "prompts/list":
      return { jsonrpc: "2.0", id, result: { prompts: [] } };
    default:
      return fail(id, METHOD_NOT_FOUND, `Method not found: ${message.method}`);
  }
}

function isId(v: unknown): v is Id {
  return typeof v === "string" || typeof v === "number" || v === null;
}

/**
 * A POST body: a single message or a batch. Returns what to send back, or null when
 * everything was a notification (the route answers 202 Accepted).
 */
export async function handleBody(
  body: unknown,
  ctx: RpcContext,
): Promise<JsonRpcResponse | JsonRpcResponse[] | null> {
  if (Array.isArray(body)) {
    if (body.length === 0) return fail(null, INVALID_REQUEST, "Empty batch");
    const out: JsonRpcResponse[] = [];
    for (const m of body.slice(0, 20)) {
      const r = await handleMessage(m, ctx);
      if (r) out.push(r);
    }
    return out.length ? out : null;
  }
  return handleMessage(body, ctx);
}
