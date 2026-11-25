# LiveAskew editorial ad system

Preview `/ad-formats`. Shared contract: `src/lib/ads/liveaskew.ts`; pure frame-driven composition: `src/components/ads/LiveAskewAd.tsx`.

Four formats: kinetic lookbook, styling variations, personal guide reveal, occasion edit. All use 1080×1920, 30fps, 15 seconds; black #0D0D0D, ivory #FAFAFA, gold #D4AF37; bundled Bodoni Moda and system sans. No unlicensed remote fonts. Squircle preview corners are presentation chrome, not part of an export specification.

Timing: hook 0–3s, fashion 3–11s, CTA 11–15s. Frame-derived motion pauses and scrubs exactly; autoplay is off. Keep primary copy within the shared conservative safe area and validate channel overlays before release. Supply actual fashion assets, no baked-in generated text, no fabricated testimonials or human 1:1-stylist claims.

The public samples use an explicitly fictional existing image sheet for layout only. They are not proof of member results or proof that a repeated garment matches. A real one-piece variation campaign must use verified images of that same piece. Never substitute these samples into a member guide.

Signal integration boundary: consume the versioned brand contract, selected format, approved assets, copy and destination; drive the composition by frame. This change adds no renderer, publishing connection, paid generation or new orchestration. The existing Buzz member publishing bridge remains separate. No production video export is claimed until a render adapter is connected and validated.
