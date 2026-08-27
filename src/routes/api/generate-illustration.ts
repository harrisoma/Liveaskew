import { createFileRoute } from "@tanstack/react-router";
import {
  generateIllustrationBytes,
  ILLUSTRATION_ROUTE_VERSION,
} from "@/lib/generate-illustration.server";

function bytesToB64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

type Body = {
  prompt?: string;
  selfiePhotoPath?: string;
  referenceImageB64?: string;
  userId?: string;
};

export const Route = createFileRoute("/api/generate-illustration")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Body;
        const { prompt, selfiePhotoPath, userId } = body;
        let referenceImageB64 = body.referenceImageB64;

        if (!prompt || typeof prompt !== "string") {
          return new Response("Missing prompt", { status: 400 });
        }
        if (!userId || typeof userId !== "string") {
          return new Response(JSON.stringify({ error: "missing_user_id" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        // Load supabase admin + db logging helpers.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Resolve reference image: prefer explicit b64, else download from storage.
        if (!referenceImageB64 && selfiePhotoPath) {
          const { data, error } = await supabaseAdmin.storage
            .from("selfies")
            .download(selfiePhotoPath);
          if (error || !data) {
            return new Response(
              JSON.stringify({
                error: "selfie_download_failed",
                detail: error?.message ?? "no data",
              }),
              { status: 502, headers: { "Content-Type": "application/json" } },
            );
          }
          referenceImageB64 = bytesToB64(new Uint8Array(await data.arrayBuffer()));
        }

        if (!referenceImageB64) {
          return new Response(JSON.stringify({ error: "no_reference_image" }), {
            status: 422,
            headers: { "Content-Type": "application/json" },
          });
        }

        const model = "openai/gpt-image-2";
        const kind = "photoreal_client_shot";
        const startedAt = Date.now();

        const logAttempt = async (
          status: "completed" | "failed",
          extra: { error?: string; attempts?: number },
        ) => {
          try {
            await supabaseAdmin.from("style_plate_generations").insert({
              user_id: userId,
              kind,
              model,
              prompt,
              status,
              attempts: extra.attempts ?? 1,
              duration_ms: Date.now() - startedAt,
              error: extra.error ?? null,
            });
          } catch (e) {
            console.error("[generate-illustration] db log failed", e);
          }
        };

        try {
          const result = await generateIllustrationBytes({
            prompt,
            apiKey: key,
            referenceImageB64,
          });
          await logAttempt("completed", { attempts: 1 });
          return Response.json({
            b64_json: bytesToB64(result.bytes),
            routeVersion: result.routeVersion,
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          await logAttempt("failed", { attempts: 1, error: msg });
          return new Response(msg, { status: 502 });
        }
      },
      GET: async () => Response.json({ routeVersion: ILLUSTRATION_ROUTE_VERSION }),
    },
  },
});
