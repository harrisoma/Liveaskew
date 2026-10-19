import { createFileRoute } from "@tanstack/react-router";
import { identifyGarmentFromPhoto } from "@/lib/wardrobe-vision.server";
import { wardrobeVerdict } from "@/mobile/lib/wardrobe-reset";
import type { OnboardingAnswers } from "@/mobile/lib/recommend";
import { requireApiUser } from "@/lib/api-auth.server";
import { guardAi } from "@/lib/entitlement.server";

type Body = {
  photoDataUrl?: string;
  profile?: OnboardingAnswers;
};

export const Route = createFileRoute("/api/wardrobe/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;
        const body = (await request.json().catch(() => ({}))) as Body;
        const photo = body.photoDataUrl?.trim();
        if (
          !photo ||
          !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo) ||
          photo.length > 4_800_000
        ) {
          return Response.json({ error: "missing_photo" }, { status: 400 });
        }

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
