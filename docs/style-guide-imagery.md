# Style guide imagery

The public guide sample is a fictional client, not a member account. `public/images/style-guide/sample-capsule.png` is AI-created illustrative fashion artwork generated on November 24, 2026. Its 4-column, 3-row cells correspond to the twelve entries in `studioSample.capsule`, in order. It contains no retail products, prices or availability claims. The `sampleIllustrations` flag is used only by the public sample route; never pass it for member guides.

The outfit gallery in member guides uses existing owner-scoped `GuideLook.tryOnUrl` previews. The cover prioritizes a personal outfit render, then the member's uploaded photo with an explicit reference label. No stock model replaces a member. Actual capsule product photos continue to come from verified retailer matches. Missing imagery must remain visibly unavailable rather than being represented as a completed personal image.

`sample-week.png` is an AI-created fictional-client sheet generated on November 24, 2026. Its four-column, two-row grid contains the seven distinct outfits in `sampleGuideLooks`, in order; cell eight is blank and is never rendered. The same fictional adult client appears throughout. Panels use their native 1:2 aspect ratio. No member photo was used for public sample artwork.

The delivery standard is seven distinct weekly outfits, seven successfully loaded personal images, a coordinated 12–15-piece wardrobe (the current generator delivers 12) and two or three styling variations. Render-job readiness alone does not mark the full guide complete. Legacy guides missing variations remain readable and visibly in progress until the member explicitly updates them. The public sample has seven looks and three variations; it cannot silently substitute for a member guide.
