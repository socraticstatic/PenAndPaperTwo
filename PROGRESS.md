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
| **P2** | TBD | 🟥 | Will be agreed before starting |

---

## Design phases (Claude Design's wire-up)

| D-Phase | Spec asks for | Status | Touched in |
|---|---|---|---|
| D1 | Create Supabase project, save keys | 🟥 | — |
| D2 | Create tables (pens, papers, pairings, inks) — JSONB schemas | 🟥 | — |
| D3 | Enable Row Level Security | 🟥 | — |
| D4 | Facet + Sommelier RPC functions | 🟥 | — |
| D5 | Storage bucket `media` for transparent PNGs | 🟥 | — |
| D6 | Seed initial data SQL | 🟥 | — |
| D7 | Replace sample HTML, page by page (D7.1 index … D7.6 ink-detail) | 🟧 scaffolded only | P1 — routes exist via `html-react-parser` rendering the prototype HTML verbatim. No DB binding yet. |
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

*Last updated: 2026-05-18 by P1 close-out.*
