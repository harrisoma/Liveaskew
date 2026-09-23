# Routes

TanStack Start uses **file-based routing**. This repo is the **Bee app** plus its APIs.

| File | URL |
| --- | --- |
| `index.tsx` | `/` — Bee phone UI |
| `privacy.tsx` | `/privacy` — Play Console privacy policy |
| `api/*` | Bee APIs (try-on, wardrobe, push, verify, Bee chat) |
| `__root.tsx` | app shell |

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.

Marketing and the old authenticated website were removed from this repo. They belong in a separate website project that shares only Supabase.
