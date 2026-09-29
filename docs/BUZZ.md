# Buzz — publishing looks to social networks

Buzz posts saved looks to **Instagram, Facebook, LinkedIn, X, and Threads**. Posts are
scheduled on the Honey calendar (`calendar_events`, `kind = 'post'`) and published by
`GET /api/cron/buzz` every 5 minutes, or immediately with **Post now / Retry**
(`POST /api/buzz/publish`).

## How it fits together

1. **Connect** — `POST /api/buzz/connect` stores a one-time `state` (15 minutes) and returns
   the network's sign-in URL. The network sends the person to
   `/api/public/buzz/callback`, which trades the code for tokens, encrypts them with
   `BUZZ_TOKEN_KEY` (AES-256-GCM), and saves them in `social_connections`.
   That table is service-role only; devices only ever see account names.
2. **Schedule** — the app saves the post to Honey with `scheduled_at` (the device's local
   date + time as an exact instant) and, if there is a photo, a public URL in the
   `buzz-media` bucket. Instagram requires a photo; the others can post text only.
3. **Publish** — the cron claims due posts (`scheduled` → `publishing`, one winner per row),
   refreshes expiring tokens (X every 2 hours, Threads every 60 days), posts, and records
   `posted` + link or `failed` + reason. A run that dies mid-post is marked failed after
   15 minutes rather than retried automatically, so nothing is posted twice.
4. **Sync safety** — `/api/honey` never lets a device copy change a post's status; only the
   publisher does.

## Setup checklist

| Network | Where | Notes |
| --- | --- | --- |
| Facebook + Instagram | developers.facebook.com → app with **Facebook Login for Business** | Permissions: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `business_management`, `instagram_basic`, `instagram_content_publish`. Needs **App Review** + **Business Verification** before anyone outside your team can connect. Instagram must be a professional account linked to a Facebook Page. One Connect covers both. |
| Threads | Same Meta developer portal → **Threads API** use case | Permissions `threads_basic`, `threads_content_publish`. Separate app ID/secret (`THREADS_APP_*`). App Review for public use. |
| LinkedIn | linkedin.com/developers → app → Products: **Share on LinkedIn** and **Sign In with LinkedIn using OpenID Connect** | Posts to the member's own profile. Tokens last 60 days, then the person reconnects. Company Pages need the separate Community Management API. |
| X | developer.x.com → project + app → User authentication: OAuth 2.0, **Web App** | Scopes `tweet.read tweet.write users.read media.write offline.access`. Check your X API plan's monthly post limit. |

For every network, add the redirect URL `https://<your domain>/api/public/buzz/callback`
and set `PUBLIC_APP_URL=https://<your domain>` so it matches exactly.

**Vercel:** the `*/5 * * * *` cron needs a Vercel plan that allows sub-daily crons (Pro).
On Hobby, scheduled posts only go out once a day — "Post now" still works any time.
