# Progress

**Source of truth for where we are.** Update this file when a phase moves states. Status legend: 🟥 not started · 🟧 in progress · ✅ done.

Two parallel numberings to avoid confusion:

- **D-phases** (D1–D12): the wire-up steps the design's [`design-source/project/CLAUDE.md`](design-source/project/CLAUDE.md) prescribes — Supabase project → tables → RLS → seed → hydrate pages → editor UI → deploy. Sequential per the spec.
- **P-phases** (P1–P∞): work chunks **we** define, scoped to a session or a coherent deliverable. May span or skip D-phases. Use these for project planning.

---

## Project phases (ours)

| Phase | Title | Status | Notes |
|---|---|---|---|
| **P1** | Foundation: repo + scaffold + literal port of design | ✅ done (2026-05-17 → 2026-05-18) | Next.js 15 App Router, all 6 pages rendered via `html-react-parser`, Supabase + Stripe clients scaffolded, repo at [socraticstatic/PenAndPaperTwo](https://github.com/socraticstatic/PenAndPaperTwo) |
| **P2** | Vertical slice: `pens` table → live `/pen` route | ✅ done (2026-05-18) | Supabase project [`pen-and-paper-two`](https://supabase.com/dashboard/project/gmmwypnlqjqcezwxzbiw) (ref `gmmwypnlqjqcezwxzbiw`, us-west-1). `pens` table + 10 facet indexes + RLS public-read. Pilot Custom 823 seeded. `/pen` route binds 6 hero elements (breadcrumb, H1, deck, eyebrow row, key-spec table) from the row; rest of page is still prototype markup. Acceptance test passed: edited `model` to "Custom 823 ✓", reload propagated to both crumb + H1; reverted. |
| **P3** | Extend dynamic backbone: papers + inks + pairings | ✅ done (2026-05-18) | 3 more tables + RLS + indexes. Seeded Tomoe River S, Iroshizuku Tsuki-yo, Pairing №047 (Custom 823 × Tomoe). `/paper`, `/ink-detail`, `/pairing` all DB-driven for hero region (crumb, H1, deck, eyebrow row, paper keyspecs). Acceptance test: edited paper `gsm` 52→68, reload propagated to eyebrow AND weight keyspec; reverted. Production build clean (4 dynamic routes, 2 static). |
| **P4** | Kill structural hard-coding: refactor + dynamic routes | ✅ done (2026-05-18) | Shared `<EntityDetailPage>` collapses the 4-way boilerplate. JSONB shapes consolidated in `lib/supabase/jsonb-shapes.ts`. Per-entity `buildReplace` functions extracted to `lib/entities/<entity>-replace.tsx`. `database.types.ts` regenerated with full `Insert`/`Update`. New SSG routes `/pens/[id]`, `/papers/[id]`, `/pairings/[id]`, `/inks/[id]` use `generateStaticParams` over the build-time client. Old singular routes redirect at request time to the row with lowest `archive_number` — no hard-coded IDs anywhere. Production build clean: 4 SSG, 4 ƒ Dynamic legacy redirects, 2 Static. |
| **P5** | Kill home + archive hard-coding + address P3 discoveries | ✅ done (2026-05-18) | Unified `PrototypeBody`+`EntityDetailPage` → one `<PrototypeShell>`. `/` archive grids (pens, papers, pairings) and `/ink` archive tiles all bind from Supabase — every prototype reference to Lamy 2000, Aurora 88, Sailor Pro Gear etc. is gone, replaced by rows in the DB. Grids render sparse (1 each) until more seeds. Policy decision: prototype's "Tomoe River" was a casual hard-coded sample; DB's accurate "Tomoe River S" wins on `/pairing` H1 and downstream. |
| **P6** | Seed real entities + research full attributes | ✅ done (2026-05-18) | Pilot 823 and Tomoe River S expanded to full schema (heritage, service, ergonomics, all spec groups). 7 more pens seeded with web-researched specs (Pelikan M800, Lamy 2000, Sailor Pro Gear Slim, Aurora 88, Platinum 3776 Century, TWSBI Diamond 580, Pilot Vanishing Point). 8 papers (added Rhodia №16, Midori MD, Clairefontaine Triomphe, Cosmo Air Light, Apica CD Premium, Crown Mill Pure Cotton Laid, Maruman Mnemosyne, Kokuyo Shoshikku). 3 more pairings (Lamy×Rhodia, Pelikan×Triomphe, Sailor×MD). Home grids now show 8/8/4. Ink left as Tsuki-yo (1 row) per directive. |
| **P7** | Bind detail-page attribute cards below hero | ✅ done (2026-05-18) | All 8 pen cards, all 8 paper cards, all 6 ink cards, and pairing's 5-axis breakdown + measurements + conditions tables now bind from the row JSONB. Progressive disclosure: empty rows / empty cards hidden. New modules: `lib/entities/pen-attribute-cards.tsx`, `paper-attribute-cards.tsx`, `ink-attribute-cards.tsx`, `pairing-extras.tsx`. Pairing uses a counter closure to distinguish the two `<table class="meas-table">` elements (first → measurements, second → conditions). |
| **P8** | Eliminate remaining hard-coding on home + detail pages | ✅ done (2026-05-18) | Pairing-of-the-week hero bound to `is_pairing_of_week=true`. `site_meta` key/value table seeded for masthead chrome (Volume, season, tagline, editors). "N Entries" line computed from row totals. Topbar meta bound. Writing-sample cards on /pens/[id] + /papers/[id] bind to actual pairings featuring that entity. Comparison tray + picker result list rendered in honest empty states — NO fake substitutes. |
| **P9** | Real Search engine | ✅ done (2026-05-18) | tsvector triggers + GIN + `search_almanac` RPC w/ prefix tokens (`pil` matches Pilot). |
| **P9.1** | Search prefix matching | ✅ done | `to_tsquery` w/ `:*` per token. |
| **P9.2** | All page copy dynamic | ✅ done | `page_copy` key/value table + `{placeholder}` template substitution. Home + detail breadcrumbs bound. Author edits any string in Studio. |
| **P11** | Real pairing engine (attribute-driven) | ✅ done (2026-05-18) | SQL function library: `fn_paper_retention`, `fn_nib_tooth_pref`, `fn_flex_demand`, `fn_sizing_supply` + 5 axis-scoring functions encoding fountain-pen specialist rules (wet ink × sizing, nib size × tooth, sheen × smoothness, flex × sizing, use × mood) + safety warnings (demonstrator staining, iron-gall on uncoated, shimmer in EF nibs, bleed-through risk). `pair_match_for_pen`/`_for_paper` RPCs return ranked partners with axis breakdown + warnings. Wired into `<section id="related">` on pen + paper detail pages via `<OptimalPairings>` component. Custom 823 → Tomoe River S = 87 affinity; Crown Mill cotton = 66 (correctly ranked last for a wet vacuum-filler). |
| **P12** | Seed inks for hue/wetness/sheen/shimmer variety | ✅ done | +7 inks (Diamine Oxblood, Iroshizuku Yama-budo, Sailor Yama-dori, Robert Oster Fire & Ice, Noodler's Black, Platinum Carbon Black, J. Herbin Emerald of Chivor, Sailor Souten). Ink Cupboard reads 9 now. |
| **P10** | Real Compare engine | 🟥 queued | Client state + add/remove buttons on detail pages + side-by-side grid. |

### P2 design constraints

- **Progressive disclosure (lazy field rendering).** Per design CLAUDE.md §4 / §I.1, every optional field shows on the page only when present in the row. Seed only the Minimum Viable Record fields first; render only what data we have. No "undefined" leaks, no empty section shells.
- **Migrations as source of truth.** SQL lives in `supabase/migrations/`, committed. Apply via `mcp__supabase__apply_migration` so the file and the remote stay in sync. No paste-and-run in the dashboard.
- **Types generated, not hand-written.** Use `mcp__supabase__generate_typescript_types` after each schema change; commit the generated file. `Pen` type comes from the DB, not a hand-rolled TS interface.
- **No Storage / images in P2.** `<image-slot>` placeholder stays. Image work is its own slice once we have an asset to drop in.

---

## Design phases (Claude Design's wire-up)

| D-Phase | Spec asks for | Status | Touched in |
|---|---|---|---|
| D1 | Create Supabase project, save keys | 🟥 | — |
| D2 | Create tables (pens, papers, pairings, inks) — JSONB schemas | ✅ done | P2 + P3. All 4 tables with full JSONB schemas + facet indexes. Inks DDL extended beyond §8.1's "Phase 2" thin shape to match §7 schema. |
| D3 | Enable Row Level Security | ✅ done | P2 + P3. Public-read policies on all 4 tables. No write policies — Supabase Studio writes via service-role. Editor JWT policies are D11. |
| D4 | Facet + Sommelier RPC functions | 🟥 | — |
| D5 | Storage bucket `media` for transparent PNGs | 🟥 | — |
| D6 | Seed initial data SQL | 🟧 partial | P2 + P3 seeded 4 rows total — one per entity (Custom 823, Tomoe River S, Tsuki-yo, the 823×Tomoe pairing). Full archive seeding TBD. |
| D7 | Replace sample HTML, page by page (D7.1 index … D7.6 ink-detail) | ✅ done (substantially) | All 6 prototype pages now bind from DB: home grids (P5), archive grids (P5), detail-page heroes (P2+P3), detail-page attribute cards (P7). Remaining hard-coded chrome: home pairing-of-the-week hero, sticky comparison tray, masthead numbers — editorial structure, not entity data. |
| D8 | Wire the Sommelier picker (`/api/picker`) | 🟥 | — |
| D9 | Wire Compare drawer (`/api/compare`) | 🟥 | — |
| D10 | Search & recently viewed (Supabase index + localStorage) | 🟥 | — |
| D11 | Editor write UI (Supabase Magic Link + admin form) | 🟥 | — |
| D12 | Deployment (Vercel/Cloudflare Pages) | 🟥 | Repo is push-ready; not deployed |

---

## Off-spec additions

| Item | Why | Status |
|---|---|---|
| Stripe SDK + env vars (`lib/stripe.ts`) | User intent to sell subscriptions (not in design spec) | 🟧 scaffold only — no products, prices, or checkout flow |

---

## Known local-state caveats

- `D:\Code\PenAndPaperTwo\.next/` was corrupted on 2026-05-18 by concurrent `pnpm dev` + `pnpm build` writers. A clean `pnpm build` (no dev server) regenerates correctly. See [`reference_nextjs_dev_build_race`](../.claude/projects/C--Users-micah/memory/reference_nextjs_dev_build_race.md).

---

*Last updated: 2026-05-18 by P11 close-out (attribute-driven pairing engine live).*
