# Customer feature completion — November 5, 2026

## Implemented in this release

- Honey: month, week and agenda views; date navigation; add/edit manual events; optional saved outfit; removal confirmation; account date-range loading.
- Wardrobe Reset: search and decision filters, rename, retry photo review, manual decisions, and an editable Bee prompt using kept pieces.
- Wardrobe account sync: explicit backup/restore, account-scoped IDs, authenticated row access and a server check that photo storage is private. Current-device decisions win for matching pieces.
- Storage recovery preserves older wardrobe records while reducing stored photos. Account sync can restore missing backed-up photos.
- Admin: Honey and Wardrobe sample previews, isolated from customer account mutations.

## Verified

- TypeScript and lint; 220 automated tests.
- Browser preview: calendar selection, add/edit event with outfit, seven-day week, wardrobe filtering and renaming; 320px layout without horizontal overflow.

## Still requires customer account verification

- Upload and analyze real wardrobe photos, sync them, then restore on another device. The runtime rejects sync if private storage is unavailable.
- Complete the personalized style-guide image pipeline with a customer's interview and selfie.
- Complete Apple login's return to the app and the trial/payment/entitlement walkthrough.

## Deferred by owner

Onixus Signal setup is not ready. Member social connections and automated publishing remain pending. This release does not enable those integrations.

Calendar connections currently import iCal feeds in one direction when the member requests sync; they are not two-way calendar integrations. These additions do not establish that every proposed app feature is production-complete.

## Bee and Honey completion pass — November 2026

Implemented in this branch:
- Bee styling chats and outfit generation receive up to 12 kept wardrobe records, up to three small piece photos, and the latest 12 outfit feedback records. Talk/crisis replies do not receive wardrobe images or styling context.
- Outfit feedback supports quick responses and custom words; account sync uses existing look JSON. Newer feedback wins when merging device/account copies.
- Honey expands supported calendar recurrences, exclusions and moved occurrences; timed events display in the requesting device timezone. Import refuses incomplete/oversized/unsupported feeds rather than reconciling a truncated result.
- New imports use calendar-scoped IDs. Refresh removes missing events within the imported window for that feed only. Legacy source/UID rows are not deleted automatically because their originating feed was never recorded.
- Per-device calendar names, visibility, last successful refresh and disconnect controls. Disconnect removes the device's saved feed link; it does not delete account events or revoke the provider link.
- Manual events support location, dress code and user-provided weather/comfort notes. These details persist in the existing description field using a versioned JSON envelope and reach Dress Me generation.
- Event reminder export includes an outfit summary and a selectable 15-minute, one-hour or one-day calendar alert. The customer must open/save the ICS event in their calendar. It is a standalone copy, not a background LiveAskew push reminder.

Still pending (do not present as shipped):
- Direct Google/Microsoft OAuth, encrypted server-side token storage, provider calendar selection, token refresh and automatic background synchronization. Provider account setup is not completed.
- Server-delivered Honey push reminders and cross-device calendar connection preferences.
- Live weather lookup; current weather notes are explicitly user supplied.
- End-to-end testing with a real external calendar and separate customer account.
