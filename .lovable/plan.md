# Bee `/chat` verification — findings

## Result table

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | History load on mount | **PASS** | `chat.tsx:248-261` calls `loadBeeConversation({ conversationId: null })`. Server fn `bee-conversation.functions.ts:15-22` picks the user's most recent `bee_conversations` row (`order updated_at desc, limit 1`), then loads `bee_messages` for it ordered `created_at asc, limit 200` (lines 32-37). Rendered in the thread map at `chat.tsx:455-482`. |
| 2 | `conversationId` tracking | **PASS** | Meta event captured: `chat.tsx:335-336` (`if (name === "meta" && json.conversationId) setConversationId(json.conversationId)`). Sent back on every subsequent POST: `chat.tsx:293` (`body: JSON.stringify({ conversationId, message: text, ... })`). Server reuses that ID at `stream.ts:154-165` and only inserts a new conversation when it's null. |
| 3 | Delta streaming | **PASS** | `chat.tsx:337-345` — on each `delta` event, `setMessages` copies the array and appends `json.t` to the last assistant message's `content`. Not buffered — the visible message mutates on every SSE chunk. |
| 4 | BeeOrb state sync | **PARTIAL PASS** | `chat.tsx:391-397` derives `orbState` from real state: `listening` (mic active), `speaking` (TTS speaking), `thinking` (`sending || streaming`), else `idle`. **Divergence from spec:** while Bee's deltas stream, orb shows `thinking`, not `speaking` (`speaking` is reserved for browser TTS). And `listening` is bound to STT, not to user typing into the textarea. All transitions are driven by real events (no hardcoding); mapping choice is cosmetic. |
| 5 | Onboarding → palette (keystone) | **PASS** | Data path is contiguous: server extractor `bee-extract.server.ts:270-323` upserts `style_profiles` (user_id conflict) with `color_palette` on every assistant turn. Dashboard reads the same row: `dashboard.tsx:109-114` selects `style_profiles.color_palette` for the current user, then `parsePalette(...)` on line 120 feeds `RevealControl`. Critical timing: in `stream.ts:315-345` the extractor `await`s to completion **before** the `onboarding_complete` SSE event is enqueued, so by the time the client fires its 1.2s navigation to `/dashboard` (`chat.tsx:346-353`), the palette row is already persisted. Fresh dashboard mount re-reads Supabase → Reveal button has real data. |
| 6 | Error handling | **PARTIAL PASS** | Retry affordance exists — `chat.tsx:502-509` renders a "Retry" button on banners with `link: null`, and known statuses (402, 429, generic) map to curated messages via `buildBanner` (`chat.tsx:69-107`). **Leak:** the fallback branch at `chat.tsx:365-372` sets `message: err.message` for unknown errors, so raw text from the SSE `error` event ("Bee stream interrupted.") or a thrown network Error can surface. Not a security issue, cosmetic. |
| 7 | HTTP 402 → `/pricing` | **PARTIAL PASS** | `chat.tsx:301-306` catches 402, reads `body.reason`, sets a banner whose CTA links to `/pricing` with copy like "Start Free Trial" / "Choose a Plan". User must click — there is **no auto-navigation**. Spec said "route to /pricing"; current UX preserves context and offers a clear one-click path instead. |

## Keystone — verified end-to-end

- Interview runs → sentinel emitted → extractor writes `style_profiles.color_palette` (upsert on `user_id`) → server emits `onboarding_complete` **after** the write finishes → client waits 1.2s → navigates `/dashboard` → dashboard reads `style_profiles.color_palette` → `parsePalette` → **Reveal my palette** button has real swatches.

**Nothing in the interview-completion or palette-population path is broken or stubbed. No fix required to close the keystone.**

## Cosmetic notes (not fixing per your instructions)

1. **Orb mapping** (item 4): streaming deltas show `thinking`, not `speaking`; typing shows `idle`, not `listening`. If you want the spec's literal choreography, orb should switch to `speaking` while `streaming` is true and to `listening` while the textarea has focus + non-empty input. Small change (~5 lines in the `orbState` ternary).
2. **Raw error text leak** (item 6): swap `err.message` → the generic copy from `buildBanner("generic")` in the fallback branch so we never render model/network strings verbatim. One-line change.
3. **402 auto-navigate** (item 7): if you want strict spec behavior, add `navigate({ to: "/pricing" })` in the 402 catch branch after setting the banner. Current banner+CTA UX is arguably better; your call.
4. **History-load conversation selection**: `loadBeeConversation` picks by `updated_at desc`; server's subscription-gate check reads `created_at asc, limit 1`. Same row for any single-conversation user (the normal case). Only a concern if a user ends up with multiple `bee_conversations` rows, which the UI currently can't create.

## Recommendation

Ship as-is on the keystone. Cosmetic items 1-3 are ~15 lines total if you want a follow-up polish pass — say the word and I'll bundle them into a small build task. Otherwise `/chat` is verified working end-to-end.
