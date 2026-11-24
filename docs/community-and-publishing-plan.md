# LiveAskew community and publishing scope

## Member experience

- Buzz is LiveAskew's member-facing publisher. Each member connects their own accounts.
- No Signal branding, Onixus Workspace navigation, or company-owned social account sharing.
- Bee drafts editable captions using a closed style vocabulary extracted from the interview
  and Style Guide, plus the selected outfit. Raw interview answers, budget, contact details,
  body measurements and private fit notes are excluded from caption requests.
- Posting remains an explicit member action. Caption generation does not publish anything.
- Hive is the in-app member community, independent of external social publishing.

## What this review branch implements

- Administrator business overview using protected aggregate reads of member style profiles,
  weekly guides, recent Hive messages, recent posts, scheduled posts and failed posts.
- Revenue/subscription and external engagement integrations display Not connected.
- Buzz account cards, clear unavailable/expired states, saved-look picker, photo preview,
  editable Bee captions and existing Honey scheduling/publishing handlers.
- Hive join flow with nickname preview, validation, privacy explanation and existing profile save.
- Existing Hive rooms, realtime messages, shared looks, reporting/blocking and moderation retained.

## Signal native publishing: not connected by this UI branch

Buzz currently uses LiveAskew's own `/api/buzz/*` OAuth and publishing implementation.
Signal's `native-social-connect-start` authenticates an Onixus Supabase user and an owned Signal
profile. A LiveAskew member session is not interchangeable with that credential.
Do not send a member to Workspace or reuse an administrator's Signal profile to bridge this gap.

The required integration is an authenticated server-to-server member bridge: bind each LiveAskew
member to an isolated publishing profile, keep consent and credentials server-side, return provider
OAuth directly to LiveAskew, and reconcile provider receipts into the member's Honey post. The
bridge must reject another member's connection/post IDs and reconcile uncertain submissions before
retrying. Provider availability must come from that bridge rather than hardcoded Connect buttons.
No bridge credentials, OAuth configuration, tokens, deployments, or live posts were changed here.

## Community reuse investigation

- Existing Hive already provides rooms, realtime messages, look attachments, reporting, blocking,
  and admin moderation. Retaining this avoids duplicate authentication, member data and moderation.
- https://github.com/burakboduroglu/social-web — React/TanStack + Supabase with MIT license;
  useful candidate for feed patterns, but an additional Bun/Drizzle backend, not a drop-in component.
  Not security-audited or adopted by this branch.
- https://github.com/NodeBB/NodeBB — maintained forum platform, GPL-3.0; separate runtime and SSO
  integration, larger than Hive's current small-community requirement.
- https://github.com/discourse/discourse — complete discussion platform, GPL-2.0; separate hosting,
  authentication and UI integration rather than an embedded React community widget.

Recommendation: finish Hive's existing small community first. Evaluate a forum platform only if
requirements expand to searchable long-form topics, extensive groups and forum administration.

## Hive member-network release

Hive now has a main member feed, member-created public or private groups, a My Groups view,
public group discovery/joining, leaving groups, owner-issued friend invitations, and private
room conversations using the existing realtime message view. The existing Hive crest replaces
Bee in the join flow and community home; the styling marketing sidebar is hidden in Hive.
Invitations are single-use, expire after seven days, require a signed-in Hive profile, and survive
web sign-in through session storage. Native invitations use the HTTPS app host.

Migration `20261124230000_hive_member_groups.sql` was applied transactionally and recorded in
LiveAskew (`jpxswrcwpsdgbwndjmow`) on 2026-11-24 following owner approval to merge.
Verification: membership/invitation RLS enabled; six existing rooms preserved; Main Network added;
no existing messages changed.
The disposable PostgreSQL test verifies outsider read/write denial, owner-only invitation
creation, joining public groups, accepting a private invitation, one-use tokens, leave revocation,
and main-network posting. A dedicated CI job repeats those checks without production credentials.
The local preview uses clearly labeled sample members and groups; no real invites are sent.
