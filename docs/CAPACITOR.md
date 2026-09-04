# Capacitor — Bee by LiveAskew

Standalone phone app. App ID is permanent: `co.liveaskew.app`.
Website marketing is a later, separate frontend. This repo’s native layer is the app only.

## Commands

```bash
npm run dev          # preview the phone UI (same Bee API as this repo)
npm run dev:app      # Vite SPA used inside Capacitor
npm run build:app    # writes webDir `dist`
npm run cap:sync     # build:app && cap sync
```

## Native projects

`npx cap add ios` and `npx cap add android` generate `ios/` and `android/`.
Bundle identifier must stay `co.liveaskew.app`.

## Plugins (locked)

| Plugin                          | Why                                      |
| ------------------------------- | ---------------------------------------- |
| `@capacitor/camera`             | Styling photo. Never alter proportions.  |
| `@capacitor/push-notifications` | Recommendation ready / tier upgrade only |
| `@capacitor/haptics`            | Save, upgrade, Bee reply                 |
| `@capacitor/status-bar`         | Full-bleed `#e0e5ec` under the notch     |
| `@capacitor/keyboard`           | Chat composer above the keyboard         |
| `@capacitor/app`                | Background / resume                      |

Safe-area insets use `env(safe-area-inset-*)` (there is no published `@capacitor/safe-area` package).

## Auth (Google / Apple)

Supabase OAuth. Redirect URI: `co.liveaskew.app://` (native) and the preview origin (web). After Google, the app sends an email OTP. After Apple, collect a phone number and send a 6-digit SMS (private relay hides the real inbox).

## Virtual try-on

`POST /api/tryon` → `N8N_TRYON_WEBHOOK_URL` with selfie + garment and `preserveBodyProportions: true`. Results cache on `tryon_renders.cache_key`. If n8n is unset, the API returns the unaltered selfie — it never invents a reshaped body.

## iOS submission (not done in this environment)

- Apple Developer ($99/yr)
- Bundle ID = `co.liveaskew.app`
- APNs key in the Apple Developer portal, then FCM or equivalent for Capacitor push
- TestFlight before public review

## Android submission (not done in this environment)

- Google Play Developer ($25 one-time)
- Generate a keystore and back it up off-laptop — losing it ends updates on this listing
- Privacy policy URL + Data safety form (see `STORE_LISTING.md`)
- Internal testing track before production

## Signing

Do not commit `*.keystore` / `*.jks`. This cloud environment cannot create App Store or Play listings.
