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

Implemented: interview-to-outfit curation, coordinated wardrobe validation, eight-look background generation, the fixed editorial presentation, and a per-image visual review through the existing Onixus `liveaskew-media` service. The service receives the generated image first and the member reference second. All seven rubric criteria must pass; uncertain outcomes block approval. The queue stores the standard version, brief, SHA-256 image/reference fingerprints, criterion outcomes, reasons, reported model/request ID and reported cost. Missing provider metadata remains null, never an invented model or price.

Generated images and their review state are separate. A successful image response is not visual approval. The guide reaches ready only after all reviews pass, exact duplicate image bytes are excluded and every image uses the same reference. Approval is invalidated by an edited outfit brief. Passed unchanged images are not rescored. Browser-supplied approval is not stored as server evidence.

Review outages retry review only, up to three times per image under the existing membership and hourly vision allowance. Review-only requests reject missing cached images instead of generating replacements. Definite failures retain their findings and require changing the affected look; no automatic paid regeneration was added. The member can explicitly queue checks for existing images. Nothing retroactively launches paid review on opening a legacy guide. References retain the existing private 24-hour maximum, then require re-upload to resume. Original generated images are preserved.

Limits: the existing vision endpoint accepts PNG/JPEG/WebP data URLs up to 3.6 million characters each. Unsupported or oversized images remain unapproved and are preserved; they are not silently reduced or counted as passed. Full collection-level visual comparison of repeated garments, bounded selective regeneration, and live reviewer calibration against representative member photos remain future work. Unit/integration fixtures establish control-flow correctness, not the critic's real-world accuracy. The direct render response continues to say `not_reviewed`; the authenticated guide status exposes the authoritative durable review results.

## Fashion editorial presentation

The guide is a personal fashion journal. Its LiveAskew masthead, serif display headlines, full-length cover photograph, restrained gold captions, four-column desktop outfit index and two-column phone index are shared product components. Photograph and outfit remain primary; controls are compact and secondary. Wardrobe spreads use isolated garment imagery and useful stylist notes. Typography, spacing and the page sequence are deterministic. No AI-generated page typography is accepted.

Palette: white `#ffffff`, black `#000000`, readable light-mode gold `#8b6914`, dark-mode gold `#dabb6e`. Display typography uses locally bundled Bodoni Moda (Google Fonts, SIL Open Font License; license retained at `public/fonts/Bodoni-Moda-OFL.txt`); body and interface text retain the application font. The font is served by LiveAskew, with no third-party font request. Photography must never be cropped to fit a headline or hide missing shoes. This editorial shell must work equally for streetwear, country, bold, casual and other member-directed aesthetics; it does not impose luxury clothing.

Production uses the existing Onixus image gateway. Bee gathers and confirms the member brief and presents the result; Signal tools can perform production through the existing integration. This presentation framework supplies fixed, versioned layout and typography. No one-off Codex-created page is required for each member. Existing gateway credentials, provider routing and member ownership remain authoritative; no replacement orchestration service is required merely to adopt this visual standard.
