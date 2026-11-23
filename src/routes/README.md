# Routes

TanStack Start uses **file-based routing**. This repo holds the LiveAskew company website,
the Bee web app, and their APIs.

| File                      | URL                                                                     |
| ------------------------- | ----------------------------------------------------------------------- |
| `index.tsx`               | `/` — company home page (`src/site/HomePage.tsx`)                       |
| `apps.tsx`                | `/apps` — the Bee styling app: Bee, Honey, Buzz, The Hive, pricing, FAQ |
| `design-studio.tsx`       | `/design-studio` — Design Studio                                        |
| `consulting.tsx`          | `/consulting` — Business Consulting                                     |
| `book.tsx`                | `/book` — consultation request form (`?service=` pre-selects)           |
| `app.tsx`                 | `/app` — the Bee web app itself                                         |
| `privacy.tsx`             | `/privacy` — privacy policy                                             |
| `style-guide-preview.tsx` | `/style-guide-preview` — sample style guide (noindex)                   |
| `api/public/booking.ts`   | consultation requests → `personal_styling_inquiries` + booking webhook  |
| `api/*`                   | Bee APIs (try-on, wardrobe, push, verify, Bee chat, billing)            |
| `__root.tsx`              | app shell                                                               |

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.

Website pages share `src/site/chrome.tsx` (nav + footer), `src/site/ui.tsx` (building blocks)
and `src/site/company.css`. Keep app styles (`src/mobile/styles.css`) out of route files'
top-level imports, or they load on every page.
