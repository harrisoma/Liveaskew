# LiveAskew

LiveAskew is a TanStack Start application deployed in its own Vercel project, with its own Supabase project for data, authentication, and generated-image storage. AI requests are routed through an Onixus tenant connection.

## Service boundaries

- **Vercel:** hosts the LiveAskew web application and server routes.
- **Supabase:** owns LiveAskew authentication, database, and storage.
- **Onixus AI:** exposes an OpenAI-compatible `/v1` endpoint and handles model routing for LiveAskew.

LiveAskew sends `Authorization: Bearer <ONIXUS_AI_API_KEY>`, `X-Onixus-Organization-ID`, and `X-Onixus-Client: liveaskew` on AI requests. Keep all Onixus credentials server-side.

## Local development

1. Copy `.env.example` to `.env` and add the required values.
2. Run `npm install`.
3. Run `npm run dev`.

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

For the current Supabase deployment, set `ONIXUS_AI_BASE_URL` to the Edge Function URL without a trailing slash: `https://rjwbfkuzgusaoizcmmgf.supabase.co/functions/v1/onixus-ai-gateway`. LiveAskew appends the OpenAI-compatible route (`chat/completions`, `images/generations`, or `images/edits`). The service role key and all Onixus values must never use the `VITE_` prefix.

## Verification

```bash
npm run build
npm test
```

Environment files are intentionally excluded from Git. Configure production values in Vercel Project Settings.
