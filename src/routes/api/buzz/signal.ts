import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
import { signalCommand, signalSummary, safeSignalAuthorization } from "@/lib/buzz/signal-contract";

async function handle(request: Request) {
  const user = await requireApiUser(request);
  if (user instanceof Response) return user;
  if (user === "preview") return Response.json({ error: "sign_in_required" }, { status: 401 });
  if (process.env.ONIXUS_SIGNAL_MEMBER_ENABLED !== "true") return Response.json({ enabled: false });
  const key = process.env.ONIXUS_SIGNAL_PUBLIC_KEY;
  if (!key) return Response.json({ enabled: true, error: "not_configured" }, { status: 503 });
  let command: { endpoint: string; body: unknown } = {
    endpoint: "native-social-summary",
    body: {},
  };
  if (request.method === "POST") {
    try {
      command = signalCommand(await request.json());
    } catch {
      return Response.json({ error: "invalid_action" }, { status: 400 });
    }
  }
  try {
    const upstream = await fetch(
      `https://rjwbfkuzgusaoizcmmgf.supabase.co/functions/v1/${command.endpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: request.headers.get("Authorization") ?? "",
          apikey: key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command.body),
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!upstream.ok)
      return Response.json(
        { enabled: true, error: "signal_unavailable" },
        { status: upstream.status === 401 ? 401 : 503 },
      );
    const data = await upstream.json();
    if (request.method === "GET")
      return Response.json({ enabled: true, ...signalSummary.parse(data) });
    if (command.endpoint === "native-social-connect-start") {
      const url = safeSignalAuthorization(data.authorizationUrl);
      if (!url) throw new Error("invalid_authorization_url");
      return Response.json({ url });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ enabled: true, error: "signal_unavailable" }, { status: 503 });
  }
}
export const Route = createFileRoute("/api/buzz/signal")({
  server: {
    handlers: { GET: ({ request }) => handle(request), POST: ({ request }) => handle(request) },
  },
});
