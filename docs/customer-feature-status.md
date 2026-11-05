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
