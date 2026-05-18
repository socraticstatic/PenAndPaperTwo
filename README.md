# Pen & Paper Two

An editorial pairing almanac for fountain pens and the papers they were made for. This repository is the production scaffold around the Claude Design handoff bundle from `2026-05-17`.

## What's here

```
PenAndPaperTwo/
├── app/                      # Next.js 15 App Router
│   ├── layout.tsx            # fonts, prototype CSS, prototype JS (image-slot, React UMD, Babel, tweaks-panel, tweaks, search)
│   ├── globals.css           # Tailwind v4 entrypoint
│   ├── page.tsx              # /                — index.html
│   ├── pen/page.tsx          # /pen             — pen.html
│   ├── paper/page.tsx        # /paper           — paper.html
│   ├── pairing/page.tsx      # /pairing         — pairing.html
│   ├── ink/page.tsx          # /ink             — ink.html
│   └── ink-detail/page.tsx   # /ink-detail      — ink-detail.html
├── components/
│   ├── PrototypeBody.tsx     # server-side html-react-parser wrapper
│   └── InlineScripts.tsx     # re-runs each page's inline <script> blocks after hydration
├── lib/
│   ├── prototype.ts          # reads /public/prototype/*.html, extracts body + inline scripts, rewrites links
│   ├── supabase/
│   │   ├── client.ts         # browser client (anon key)
│   │   └── server.ts         # SSR client (cookies-backed)
│   └── stripe.ts             # server-side Stripe SDK singleton
├── public/prototype/         # mirror of the design bundle — also browsable standalone at /prototype/index.html
└── design-source/            # the handoff bundle as delivered (README, chats/, project/) — committed for reference
```

## How the port works

This is a **literal port** of the Claude Design prototype. The prototype's HTML, CSS, and JS files live in `public/prototype/` and are loaded unchanged. Each Next.js route:

1. Reads the corresponding `.html` from `public/prototype/` at request time (Node `fs`).
2. Extracts the `<body>` and parses it through `html-react-parser` so the markup becomes a React tree without rewriting any of it.
3. Strips external `<script src>` tags (the layout loads them once globally) and captures inline `<script>` blocks. `InlineScripts` re-appends fresh `<script>` nodes after hydration so the picker, tray, and chip handlers fire.
4. Rewrites cross-page `href="pen.html"` etc. to Next.js routes (`/pen`).

The original prototype is also served as static files: visit `/prototype/index.html` to see the unmodified design as Claude Design exported it.

## Getting started

```powershell
pnpm install --ignore-scripts --prefer-offline
cp .env.local.example .env.local   # fill in Supabase + Stripe keys
pnpm dev
```

Open `http://localhost:3000`.

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) | RSC, route handlers for Stripe webhooks, image optimisation |
| Language | TypeScript strict | |
| Styles | Tailwind v4 + the prototype's own `styles.css` | Tailwind for net-new UI; prototype CSS is left verbatim |
| Database | Supabase (Postgres + Auth + Storage) | matches `design-source/project/CLAUDE.md` §III schemas |
| Payments | Stripe Subscriptions | gating editor's-notes / compare / picker per design CLAUDE.md §II.5 |
| Runtime React (prototype) | React 18 UMD + Babel standalone | runs the prototype's `tweaks-panel.jsx` / `tweaks.jsx` inline, isolated from Next.js's React 19 root |

## Roadmap

See [PROGRESS.md](PROGRESS.md) for current state. We track two parallel numberings:

- **D-phases (D1–D12)** — the wire-up steps from the design's [`design-source/project/CLAUDE.md`](design-source/project/CLAUDE.md).
- **P-phases (P1–P∞)** — work chunks we define ourselves; may span or skip D-phases.

The phases below mirror the design's Part II (the D-phases).

1. **Supabase schema** — `pens`, `papers`, `pairings`, `inks`, `pairing_axes`, `images`. Migrations live in `supabase/migrations/`. Seed from `design-source/project/CLAUDE.md` §III enums.
2. **Image pipeline** — every product photo is a transparent PNG. Store in Supabase Storage bucket `assets/`, swap `<image-slot>` for `<Image>` per page.
3. **API routes** — `/api/pens`, `/api/papers`, `/api/pairings`, `/api/picker`, `/api/compare`. Currently the prototype renders hard-coded sample data; each route handler will return the real query and we'll swap sections inside the parsed body.
4. **Auth + subscriptions** — Supabase Auth for sign-in, Stripe Checkout for the subscription, webhook → `subscriptions` table → middleware-gated routes for premium views.
5. **Editorial CMS** — long notes live in a `notes` table edited inside Supabase Studio. The detail-page editorial blocks pull from there.

## Conventions

- pnpm only. `pnpm install --ignore-scripts --prefer-offline` for dev; full install only when a feature needs native deps.
- Don't touch `public/prototype/`. It's the design bundle, reproduced verbatim. Make changes by editing the rendered page or by promoting a section out into a React component, never by mutating the prototype HTML.
- `design-source/` is read-only. It's the canonical record of what was handed off.

## Related

- Design bundle source: Claude Design link `wJF0gQyYrJjPZ8cZrBe6vA`
