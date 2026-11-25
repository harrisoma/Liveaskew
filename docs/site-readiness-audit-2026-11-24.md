# LiveAskew readiness audit — November 24, 2026

## Verdict

The public site presents well, but the business is not operationally finished. A passing page load is not proof of checkout, project onboarding or publishing. This audit did not charge a card, publish a social post, create a client project or expose credentials.

## Live checks

- Home, Design Studio, pricing, booking, privacy and app entry returned HTTP 200 on www.liveaskew.com.
- Browser checks at 1440px and 390px: no horizontal overflow, broken images or page errors across home, Design Studio, pricing, booking and app entry.
- robots.txt and sitemap.xml returned HTTP 200. App entry shows real sign-in controls; authenticated member journey not exercised.
- Design Studio POST /api/public/studio-checkout with same-origin headers returned HTTP 503, {"error":"billing_not_configured"}.
- Vercel production environment names lack STRIPE_LIVE_API_KEY and PAYMENTS_LIVE_WEBHOOK_SECRET. Sandbox key exists for preview only; no sandbox webhook secret listed. No raw secret values were printed.
- Booking has a Supabase system of record, but BOOKING_WEBHOOK_URL is not configured. Saving an inquiry does not create a Workspace project or notify the studio through that webhook.
- Four ad formats are implemented, not ten. At audit time the custom domain still served PR75; PR76 ad-formats was only deployed in preview and returned 404 on production. Deployment must be checked after this release.

## Signal and Workspace

- Signed-in Workspace can open Signal. The embedded Signal business selector includes LiveAskew, with a saved strategy profile and Autopilot paused. It shows zero verified published items for LiveAskew. This is not proof that its OAuth connections are valid.
- Outer Workspace business selector shows Onixus while inner Signal can show LiveAskew: this context mismatch should be resolved before promising a company-specific project handoff.
- LiveAskew member Buzz publisher remains disabled. No Meta, LinkedIn, Threads or X OAuth app credentials are listed on LiveAskew Vercel. Company Signal accounts and member-owned Buzz accounts are different setup paths.
- Signal's embedded connection drawer could not be opened reliably through the browser automation; no OAuth consent or grants were changed.

## Fixed in this increment

- Return from checkout no longer claims an active membership based on a query parameter.
- Checkout failure remains visible with an explicit consultation alternative instead of silently sending the visitor elsewhere.
- Added a signed-in Onixus Workspace entry point for existing clients; clearly states new project access is arranged with the studio. This link is not automatic provisioning.

## Release requirements, in order

1. Configure intended Stripe live key and signed webhook; verify the $199/month Design Studio price lookup key, currency, cadence and receipt branding. Complete test-mode purchase, cancel, failed payment and webhook tests before a separately authorized live purchase.
2. Implement and verify Design Studio subscription fulfillment: its subscriptions are explicitly ignored by the Bee membership webhook. Track studio entitlement, billing changes, project access and owner notifications separately, with idempotent receipts.
3. Connect booking intake to the correct Workspace organization with authenticated durable delivery, retries and a visible receipt; a plain Workspace link is not this integration.
4. Verify intended company social accounts in Signal, OAuth expiry/refresh and one explicitly authorized test post/permalink. For member Buzz, complete isolated member OAuth before enabling its bridge.
5. Exercise a real member journey: sign-in, interview, eight-look generation, visual review, guide viewing, account deletion and subscription cancellation. Reviewer calibration and selective image repair remain open.
6. Add/approve customer-facing service terms, cancellation/refund policy and Design Studio deliverables/turnaround boundaries; verify privacy and store disclosures against real provider data flows. No legal compliance certification is implied.
7. Finish six additional ad formats only after agreeing their copy/assets and connect the shared layout contract to the existing Signal renderer. Current previews do not export video.

## Audit limits

No production card payment, signed Stripe event, project creation, live post, authenticated member purchase or real-image visual-review calibration was completed. Do not present those paths as verified based on this audit.
