# Buzz member setup through Signal

Draft integration; not enabled in production. Depends on Onixus Signal PR389.

The backend forwards the signed-in member token only to the fixed Signal project.
Signal verifies it against LiveAskew Auth and derives an isolated profile.
The browser cannot supply the owner, profile, or member identity.

After the Signal migration and functions are deployed and its owner mapping is
verified, set server-only ONIXUS_SIGNAL_PUBLIC_KEY to the Signal public key and
ONIXUS_SIGNAL_MEMBER_ENABLED=true. Do not use a service-role key.

Today offers an optional connect/skip prompt, and Buzz exposes authorization,
asset selection, refresh, and disconnect. Returning from OAuth reloads the
member's actual connections; the URL is not treated as proof of authorization.

Initial rollout is web-only; Signal callbacks return to www.liveaskew.com/app.
Native app return handling needs separate verification before enabling native
connections. Signal publishing is intentionally unavailable in this UI until
the member-scoped queue and approval path is implemented and tested. Existing
direct-provider Buzz remains unchanged while the feature flag is disabled.

Required acceptance: two different LiveAskew members, provider approval/denial,
asset selection, disconnect, expired session, disabled provider, and refresh.
Do not activate until these pass with the configured service owner.
