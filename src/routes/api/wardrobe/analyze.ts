import { createFileRoute } from "@tanstack/react-router";
import { identifyGarmentFromPhoto } from "@/lib/wardrobe-vision.server";
import { wardrobeVerdict } from "@/mobile/lib/wardrobe-reset";
import type { OnboardingAnswers } from "@/mobile/lib/recommend";
import { requireApiUser } from "@/lib/api-auth.server";
import { z } from "zod";
import { guardAi } from "@/lib/entitlement.server";

const bodySchema = z.object({
  photoDataUrl: z
    .string()
    .max(4_800_000)
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/),
  profile: z
    .object({
      goal: z.string().max(100).nullable().optional(),
      fit: z.string().max(100).nullable().optional(),
      budget: z.string().max(100).nullable().optional(),
    })
    .optional(),
});

export const Route = createFileRoute("/api/wardrobe/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "invalid_photo" }, { status: 400 });
        const body = parsed.data;
        const photo = body.photoDataUrl;
        const denied = await guardAi(caller, "wardrobe");
        if (denied) return denied;
        const sight = await identifyGarmentFromPhoto(photo);
        if (!sight) {
          return Response.json({ error: "vision_unavailable" }, { status: 503 });
        }

        const profile: OnboardingAnswers = {
          goal: body.profile?.goal ?? null,
          fit: body.profile?.fit ?? null,
          budget: body.profile?.budget ?? null,
        };
        const judged = wardrobeVerdict(sight, profile);
        return Response.json({
          category: sight.category,
          label: sight.label,
          type: sight.type,
          fabric: sight.fabric,
          fit: sight.fit,
          notes: sight.notes,
          verdict: judged.verdict,
          reason: judged.reason,
        });
      },
    },
  },
});
