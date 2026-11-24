# Buzz → Signal publishing integration

The bridge is implemented behind the server-only `BUZZ_PUBLISHER=signal` setting. Default remains `native`; production has not been switched. Buzz continues to own member OAuth, encrypted credential storage, refresh, owner-scoped Honey claims and scheduling. It forwards only that owner's post and refreshed account connection to Signal's existing native publisher adapters, using the existing Onixus gateway server credential. There is no company-account fallback or member-facing Signal UI.

Signal uses organization/member/post receipts and an immutable content fingerprint. Duplicate/uncertain requests do not trigger a second publish. Honey retains publishing status until verified delivery plus a permalink; cron reads receipts without resubmitting. LinkedIn/other accepted-but-unverified or uncertain states require verification before a new post is created. Account deletion removes the member's Signal receipts before deleting the auth user when the bridge is enabled.

## Verified

- Five client tests: member-owned payload, sibling endpoint, pending response, status-only reconciliation and cleanup failure.
- Nine Signal handler tests: authorization, member separation, credential non-retention, idempotency, conflict, unverified results, uncertainty, disabled publishers and owned media.
- Signal endpoint and receipts migration deployed to staging `nixoczkmzovigvdiinzh`; unauthenticated requests return 401.

## Activation blockers

- Staging lacks `ONIXUS_GATEWAY_CLIENTS` and required Meta/LinkedIn/Threads/X publisher configuration. Existing production Signal has those configuration names, but their effective values/readiness were not verified and no production Signal resources were changed.
- LiveAskew has no Meta, LinkedIn, Threads or X OAuth app credentials configured. The current Buzz connection flow therefore cannot connect members yet. Using existing central Signal OAuth apps requires a delegated member OAuth start/callback/finalization flow; the company-scoped Signal client endpoint is not a substitute. Alternatively, provider apps must be configured for LiveAskew's existing member OAuth callbacks. Do not route members to company accounts.
- The deployed LiveAskew gateway key is sensitive and is not readable through Vercel's environment API; no token was rotated or copied.
- No authenticated end-to-end connection or live social post has been verified. Do not enable the bridge or advertise working social connections based on mock tests alone.

Next release gate: configure the chosen member OAuth path, verify one owner's account and cross-member denial, verify authenticated Signal readiness, then explicitly approve a disposable external post and confirm its live URL. Only then enable `BUZZ_PUBLISHER=signal` and verify scheduling/receipt reconciliation and receipt deletion end-to-end.
