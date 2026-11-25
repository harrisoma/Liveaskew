# LiveAskew final style-guide standard

Version: `liveaskew-personal-guide-v1`. Bee owns the member-facing builder; Onixus Imaging is its internal image provider. Members do not need Signal, another editor, or Codex to curate a guide.

## The client deliverable

The approved presentation is the product template, not a separate marketing mockup:

1. Personal Edit: member name, their own personal preview, lifestyle-based style direction.
2. Eight complete, distinct outfits, each with its garment list and Fit / Feel / Fabric notes.
3. One coordinated 12–15-piece wardrobe; every outfit uses those same named pieces.
4. Two or three concrete styling variations using actual capsule piece IDs.
5. Fit, proportion, movement, fabric and tailoring advice grounded in the interview.
6. Practical shopping priorities, finishing touches and secondary colour guidance.

The black, white and restrained gold LiveAskew shell, typography hierarchy, squircle controls and responsive layouts come from the shared application components. AI does not generate screenshots, UI text or page layouts. Use personal images without cropping away shoes or accessories. Mobile is a touch interface; desktop uses its available width.

## Bee's curation responsibilities

Use the completed interview, explicitly stated style influences, calendar occasions, budget, fit/sensory preferences, saved wardrobe decisions and reference photo. Urban, country, classic, luxury, Miami, New York, casual and bold are possible influences, not fixed demographic assignments. Mix influences as the member describes them. Do not infer taste from face, age, body size or ethnicity. Never claim that an illustrated garment is something the member owns or that an approximation guarantees fit.

Bee writes the structured brief. Onixus Imaging edits the member's reference into one portrait per look. `src/lib/style-guide-standard.ts` supplies the versioned image direction and requested 1024×1536 image size. The provider response records the model and request ID when supplied; a standard version labels the brief, not a passed quality review.

## Visual acceptance requirements

Every finished outfit must preserve the reference person's identity and natural proportions, show the full head-to-foot outfit, match the specified clothes/colours/layers/accessories, maintain consistent repeated capsule pieces, have realistic anatomy and fabric detail, and contain no generated text, watermark or invented branding. Missing or uncertain evidence fails that requirement; a high average score cannot compensate for a wrong person or missing garment.

The public fictional-client sample is explicitly labeled and never substituted into a member guide. Missing personal images stay missing. Existing paid receipts are retained; revising this standard never silently rerenders them.

## What is implemented versus still required

Implemented: interview-to-outfit curation, coordinated wardrobe validation, eight-look background image jobs through the existing Onixus image-edit API, shared visual prompt/size/version, member-specific imagery, consistent application presentation, loaded-image and structural delivery checks, and recoverable job state. These checks establish completeness, not subjective visual quality.

Still required before claiming automatic visual approval: an actual image-aware QA step comparing each output with its source photo and outfit specification; durable per-image review receipts containing the standard version, image hash, reviewer/model, explicit criterion outcomes and reasons; a guide-level consistency review across all eight outputs; and cost-bounded repair of failed assets without regenerating passed images. Review outages must preserve generated assets and retry review only. Ambiguous paid generation must not be submitted twice. No placeholder score or unperformed review may be recorded as passed.

The current render response explicitly reports `visual_review: not_reviewed`. Do not describe a loaded image, successful HTTP response or complete guide checklist as visual approval. The next implementation should reuse Onixus' existing image-aware service after verifying its multi-image comparison contract, rather than inventing a second image provider or assuming an endpoint supports it.
