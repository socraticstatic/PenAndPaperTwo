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
| **P5** | (queued) Kill home + archive hard-coding | 🟥 | `/` fetches pairing-of-week + featured grids from DB; `/ink` archive lists all inks; seed more rows so the home grids render non-empty. |
| **P6** | (queued) Bind every attribute below the hero | 🟥 | 8 attribute cards on pens + papers, 6 on inks, 5-axis + measurements + conditions tables on pairings, recommended-marriages rails, writing-sample cards. Full progressive disclosure. |

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
| D7 | Replace sample HTML, page by page (D7.1 index … D7.6 ink-detail) | 🟧 partial | P2 + P3 — D7.2/D7.3/D7.4/D7.6 are DB-driven for hero regions. D7.1 (`/`) and D7.5 (`/ink` archive grid) still render prototype HTML verbatim. Detail pages below the hero are still hard-coded prototype markup — the binding pattern is proven; extending it down each page is mechanical. |
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

*Last updated: 2026-05-18 by P4 close-out (refactor + dynamic routes).*
