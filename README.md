# LiveAskew — Bee

Bee is one product on three surfaces: **web app**, **iOS**, and **Android**. The stylist is the same — Fit, Feel, and Fabric. Clothes follow your body. We never alter it.

- App ID: `co.liveaskew.app` (permanent on iOS and Android)
- Web app: `/` and `/app` on this Vercel project
- Design: neumorphic `#e0e5ec`, rounded rectangles only, Poppins / Nunito

```bash
npm run dev          # Bee web app + API
npm run dev:app      # Capacitor SPA (same UI, native bundle)
npm run build:app && npx cap sync
npm test
```

## Platforms

| Surface | How it ships |
| --- | --- |
| **Web app** | TanStack Start on Vercel. Open `/` or `/app`. Installable via `manifest.webmanifest`. |
| **iOS** | Capacitor project in `ios/`. Bundle ID `co.liveaskew.app`. URL scheme `co.liveaskew.app://`. |
| **Android** | Capacitor project in `android/`. applicationId `co.liveaskew.app`. Same custom scheme. |

Native notes: `docs/CAPACITOR.md`. Store copy: `STORE_LISTING.md`. Privacy: `/privacy`.

## Service boundaries

- **GitHub:** source of truth (`harrisoma/Liveaskew`).
- **Vercel:** Bee web app and Bee API routes.
- **Capacitor:** iOS and Android shells.
- **Supabase:** authentication, database, and storage.
- **Onixus AI:** OpenAI-compatible `/v1` for model routing.

LiveAskew sends `Authorization: Bearer <ONIXUS_AI_API_KEY>`, `X-Onixus-Organization-ID`, and `X-Onixus-Client: liveaskew` on AI requests. Keep all Onixus credentials server-side.

## Local development

1. Copy `.env.example` to `.env` and add the required values.
2. Run `npm install`.
3. Run `npm run dev` for the web app, or `npm run cap:sync` then open Xcode / Android Studio.

## Required production environment

Add the following values to the LiveAskew Vercel project:

```text
SUPABASE_PROJECT_ID
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
ONIXUS_AI_BASE_URL
ONIXUS_AI_API_KEY
ONIXUS_AI_ORGANIZATION_ID
```

For native store binaries, also set `VITE_API_BASE` and/or `CAPACITOR_SERVER_URL` to the Vercel origin so `/api` is not relative to a file WebView.

For the current Supabase deployment, set `ONIXUS_AI_BASE_URL` to the Edge Function URL without a trailing slash: `https://rjwbfkuzgusaoizcmmgf.supabase.co/functions/v1/onixus-ai-gateway`. The service role key and all Onixus values must never use the `VITE_` prefix.

## Verification

```bash
npm run build
npm test
```

Environment files are intentionally excluded from Git. Configure production values in Vercel Project Settings.
