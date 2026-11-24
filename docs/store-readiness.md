# LiveAskew store readiness — 24 November 2026

## Account and privacy changes

- Settings contains the resumable account setup guide, photo/notification controls, membership, privacy, support, sign-out and deletion.
- Initial member details are three steps: name, optional contact/social handles, membership preference. Saving a preference never starts a subscription or grants paid access.
- Public deletion URL: https://www.liveaskew.com/privacy#delete-account. Authenticated deletion lives in Settings. The public page also offers an ownership-verified email request for members unable to sign in.
- Deletion cancels non-terminal linked Stripe subscriptions, removes account storage, then deletes the auth user. Foreign keys cascade associated records; deleting a group owner also deletes their groups/conversations. Failure is not atomic: earlier steps can have completed. Subscription query/update failure stops deletion.
- Public and in-app privacy copy share one source. It covers optional handles, AI captions, private groups, public social-post image URLs, external deletion, offline copies and payment/social-platform limitations.

## Purchase validation: blocked for native-store release

The current client opens Stripe Checkout (including native deep-link returns). No StoreKit/Google Play Billing SDK, store receipt verification or restore-purchases flow is implemented. Do not describe web Stripe tests as native purchase validation. Digital membership sale rules and any regional external-payment entitlement/program need confirmation before submission; otherwise implement store billing, server-verified entitlements, restore, cancellation and refund/revocation webhooks. No live purchase was made in this change.

Existing server checks validate paid tiers, environment separation, subscription status/expiry and remaining trial duration. A checkout success URL alone never grants paid access. Required remaining evidence: Stripe sandbox purchase → verified webhook → correct account entitlement → portal cancellation; then equivalent Apple sandbox/Google license-tester purchase, restore, pending/cancelled purchase and refund/revocation on real devices.

## Reviewer access: not provisioned or verified

- /style-guide-preview is a public sample, not full authenticated reviewer access. Production auth has no local-development OTP bypass.
- Provide dedicated ordinary member test accounts (never an admin/service-role credential) securely in App Store Connect and Play Console App access, with a sustainable sign-in method that does not require the owner's phone or expiring email OTP.
- One account should have sample style/community content and usable membership; another should allow purchase/expired-membership review. Explain AI/photo permissions, social-provider dependencies and any unavailable connections in review notes.
- Verify on clean iOS/Android installs: sign-in, 3-step details, interview, guide, Settings, privacy, account deletion, Hive report/block, purchase/restore. Use disposable accounts for destructive deletion checks, not real member accounts.
- Store privacy labels/Data safety must match actual processors/SDKs and retention. Confirm Sign in with Apple token revocation and third-party AI consent end-to-end before submission.

References: https://developer.apple.com/app-store/review/guidelines/ ; https://developer.apple.com/help/app-review/before-submitting-for-review/complete-review/ ; https://support.google.com/googleplay/android-developer/answer/13327111
