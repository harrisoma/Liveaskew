import { TALK_TOPICS } from "@/lib/bee-talk";

/**
 * What LiveAskew offers an assistant (Claude, ChatGPT, Cursor, …). Read-mostly: the member's
 * day, looks, and calendar, plus a conversation with Bee. Pure data so tests can check it.
 */
export const MCP_TOOLS = [
  {
    name: "get_today",
    title: "Today with LiveAskew",
    description:
      "The member's day at a glance: what is on her Honey calendar for the date, the look Bee picked most recently, and her style profile (fit, feel, budget). Use this first when she asks what to wear or what her day looks like.",
    inputSchema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
          description:
            "The member's local date, YYYY-MM-DD. Pass it when you know her time zone; defaults to today in UTC.",
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "list_looks",
    title: "Her looks",
    description:
      "Outfits Bee has put together for the member, newest first: title, occasion, the pieces, fit, feel, fabric and palette.",
    inputSchema: {
      type: "object",
      properties: {
        saved_only: {
          type: "boolean",
          description: "Only the looks she saved. Default false.",
        },
        limit: { type: "integer", minimum: 1, maximum: 50, description: "Default 10." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_calendar",
    title: "Honey calendar",
    description:
      "Upcoming events, meetings, and scheduled Buzz posts on the member's Honey calendar, with any outfit note Bee left for each.",
    inputSchema: {
      type: "object",
      properties: {
        days: {
          type: "integer",
          minimum: 1,
          maximum: 60,
          description: "How many days ahead to include, starting today. Default 14.",
        },
        date: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
          description: "The member's local date for today, YYYY-MM-DD. Defaults to today in UTC.",
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "ask_bee",
    title: "Ask Bee",
    description:
      "Talk to Bee, LiveAskew's stylist, who knows the member's fit, feel and budget. Ask what to wear, or open a Real Talk conversation on motherhood, style, relationships, or work. Pass the member's words; return Bee's answer to her as Bee's.",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", minLength: 1, maxLength: 2000 },
        topic: {
          type: "string",
          enum: [...TALK_TOPICS],
          description: "A Real Talk topic. Leave out for styling.",
        },
        history: {
          type: "array",
          maxItems: 12,
          description:
            "Earlier turns of this conversation with Bee, oldest first, so she can follow on.",
          items: {
            type: "object",
            properties: {
              role: { type: "string", enum: ["user", "assistant"] },
              content: { type: "string", minLength: 1, maxLength: 2000 },
            },
            required: ["role", "content"],
            additionalProperties: false,
          },
        },
      },
      required: ["message"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
] as const;

export type McpToolName = (typeof MCP_TOOLS)[number]["name"];

export function isToolName(name: unknown): name is McpToolName {
  return MCP_TOOLS.some((t) => t.name === name);
}

export type ToolResult = {
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

export function toolText(text: string, structured?: Record<string, unknown>): ToolResult {
  return structured
    ? { content: [{ type: "text", text }], structuredContent: structured }
    : { content: [{ type: "text", text }] };
}

export function toolError(text: string): ToolResult {
  return { content: [{ type: "text", text }], isError: true };
}
