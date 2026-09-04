import { createFileRoute } from "@tanstack/react-router";
import { identifyGarmentFromPhoto } from "@/lib/wardrobe-vision.server";
import { wardrobeVerdict } from "@/mobile/lib/wardrobe-reset";
import type { OnboardingAnswers } from "@/mobile/lib/recommend";

type Body = {
  photoDataUrl?: string;
  profile?: OnboardingAnswers;
};

export const Route = createFileRoute("/api/wardrobe/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Body;
        const photo = body.photoDataUrl?.trim();
        if (!photo || !photo.startsWith("data:image/")) {
          return Response.json({ error: "missing_photo" }, { status: 400 });
        }

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
