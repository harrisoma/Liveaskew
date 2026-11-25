# Acceptance flow

1. Create/sign in to LiveAskew with Google (existing provider), or use email when Google is unavailable.
2. Answer Bee's five Fit / Feel / Fabric interview questions.
3. Take or upload a clear, full-length reference photo. Photo stays on the device for the text guide; requesting a try-on uses the existing separate image service.
4. Build a eight-look guide. The server requires eight distinct named outfit formulas; incomplete/provider-failed results keep the member at the photo step with a retry message. Rate limits do not create sample guides.
5. Review Look 1 through Look 8, each with garments, Fit / Feel / Fabric and palette. Save individual looks. Account sync stores the day labels; a sync failure is reported.
6. The durable guide queue generates all eight photo-based previews after the member explicitly requests the guide. It reuses receipts, resumes automatically and keeps missing images visibly incomplete. Existing seven-look jobs remain valid; they are never silently regenerated or charged again.
7. Before deploying eight-look generation, apply `20261124210000_eight_look_guides.sql` so new jobs accept eight look IDs while existing seven-look receipts remain valid.

Desktop uses the available page width, with a wide content area and multi-column guide. Mobile retains its touch layout. There is no simulated phone frame on computers.

## Visual review and recovery

After eight image receipts exist, each leased worker invocation reviews one stored image against the temporary reference and its original garment brief. Generated images remain visible but unapproved. The guide becomes ready only after the current rubric passes for every image and deterministic duplicate/reference checks pass. Transient review failures retry review only; no second image-generation charge is made. Permanent visual failures preserve the image and expose reasons in the guide. Explicit review-only requests reject missing cached assets. Legacy completed guides are not automatically sent for a new paid review when opened.

Review results are stored in the existing server-only `weekly_guides.results` JSON, with no schema migration or provider/secret change. Test rejection, provider outage, edited brief, duplicate images, reference expiry, membership pause and review-only requests before releasing. Live image-quality calibration remains separate from mocked provider tests.
