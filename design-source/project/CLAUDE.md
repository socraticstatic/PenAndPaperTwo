# Pen & Paper — Handoff for Claude Code

**Project:** *Pen &amp; Paper* — an editorial pairing almanac for fountain pens and the papers they were made for. Treat it like a wine catalogue: progressive disclosure, lots of whitespace, hairline rules, mono micro-labels, italic serif moments.

This is the **complete wire-up guide** for taking the prototype from hard-coded sample HTML to a live, Supabase-backed editorial site. Read [Part I](#part-i--orientation) for orientation, work through [Part II](#part-ii--the-wire-up-walkthrough) one phase at a time, and consult [Part III](#part-iii--reference) for the full schemas and SQL.

---

## Status snapshot

**Built and shipped in the prototype:**
- ✅ `index.html` — homepage with masthead, featured pairing, principles, pen + paper archives, Sommelier picker, pairings catalogue, compare table, sticky tray, colophon
- ✅ `pen.html` — single-pen detail · 8 grouped attribute cards (Identity, Nib, Ink Delivery, Body, Dimensions, Heritage, Service, Ergonomics) with spectrum bars, plus three writing-sample cards and recommended marriages
- ✅ `paper.html` — single-paper detail · 8 grouped attribute cards (Identity, Substance, Surface, Behaviour, Dry Time by Nib, Watermark & Texture, Mill & Heritage, Format) with spectrum bars
- ✅ `pairing.html` — single-pairing detail · split hero with two specimen cards, big affinity dial, writing-sample editorial moment, 5-axis breakdown, measurements + conditions tables, editor's long note, related pairings
- ✅ `ink.html` — Ink Cupboard archive · hue band, family/behaviour chips, 8 swatch cards with sheen/shimmer indicators, three curated cabinets
- ✅ `ink-detail.html` — single-ink detail · 6 grouped attribute cards (Identity, Colour & Hue, Chemistry, Behaviour, Dry Time by Nib, Pairing & Best Use), three writing-sample cards across paper tones, related inks rail
- ✅ All click-throughs wired: archive tiles → detail pages, pairing tiles → pairing.html, ink tiles → ink-detail.html, "Read in full →" links → detail pages
- ✅ Tweaks panel with 5 curated palettes, paper tones, font swaps, density modes, hero variants
- ✅ Image-slot placeholders on every visual surface, annotated with their `photos.<field>` mapping
- ✅ Every HTML file has section-level `<!-- CLAUDE CODE · … -->` comments mapping each piece of sample data to its schema field

**Not yet built (your job):**
- 🟥 Supabase project + tables + RLS policies + RPC functions
- 🟥 Storage bucket for transparent-PNG images
- 🟥 Seed data SQL
- 🟥 Dynamic templating layer (Next.js / Astro / SvelteKit — your call)
- 🟥 Editor auth + write UI
- 🟥 Production deployment

---

## Table of contents

**Part I — Orientation** *(read first)*
- §I.1 What this is
- §I.2 File map
- §I.3 Tech stack
- §I.4 The four entities + their relationships
- §I.5 Routes & click-through map (cross-reference to §2)

**Part II — The wire-up walkthrough** *(do these in order)*
- Phase 1 · Create the Supabase project
- Phase 2 · Create the tables
- Phase 3 · Enable Row Level Security
- Phase 4 · Add facet + Sommelier RPC functions
- Phase 5 · Create the Storage bucket
- Phase 6 · Seed initial data
- Phase 7 · Replace sample HTML, page by page
  - 7.1 index.html · 7.2 pen.html · 7.3 paper.html
  - 7.4 pairing.html · 7.5 ink.html · 7.6 ink-detail.html
- Phase 8 · Wire the Sommelier picker
- Phase 9 · Wire Compare
- Phase 10 · Search &amp; recently viewed
- Phase 11 · Editor write UI
- Phase 12 · Deployment

**Part III — Reference** *(schemas, DDL, queries, UI rules)*
- §1 Stack assumed · §2 Routes & click-through · §3 Image requirements
- §4–7 Pen / Paper / Pairing / Ink schemas (with Minimum Viable Records)
- §8 Supabase data model (tables, RLS, queries, RPC, storage, migrations)
- §9 File map · §10 UI conventions · §11 Editorial tone

**Part IV — Roadmap**
- §12 Open questions · §13 Phase 2

---

# Part I · Orientation

## I.1 · What this is

*Pen & Paper* is an editorial pairing almanac — fountain pens, papers, and the inks that join them — modeled on a wine catalogue. The product:

- Catalogues **pens**, **papers**, **inks**, and **pairings** with deep, comparable attributes
- Lets readers filter, sort, compare, and find pairings via a five-axis "Sommelier" picker
- Presents each entry as both a tile (in archive grids) and a full detail page

The frontend is hi-fi static HTML; your job is to swap the hard-coded HTML for content hydrated from Supabase.

## I.2 · File map

| File | Purpose | First phase to touch |
|---|---|---|
| `index.html` | Homepage — masthead, featured pairing, archives, picker, compare | 7.1 |
| `pen.html` | Single-pen detail | 7.2 |
| `paper.html` | Single-paper detail | 7.3 |
| `pairing.html` | Single-pairing detail | 7.4 |
| `ink.html` | Ink Cupboard archive | 7.5 |
| `ink-detail.html` | Single-ink detail | 7.6 |
| `styles.css` | Global tokens + components — **don't rename selectors or remove classes** | reference |
| `image-slot.js` | Design-time `<image-slot>` web-component placeholder — replace with `<img>` | every Phase 7.* |
| `tweaks-panel.jsx`, `tweaks.jsx` | Design-control panel — strip from production | optional |
| `CLAUDE.md` | This file | — |

## I.3 · Tech stack

- **Backend:** Supabase (Postgres + Storage + Auth + RLS + Realtime). **No custom REST API.**
- **Frontend:** Static HTML + `@supabase/supabase-js`. You may add Next.js / Astro / SvelteKit for SSR — none of the markup forces a framework.
- **Auth:** Anonymous for read; `role = 'editor'` JWT claim for writes (Magic Link via Supabase Auth — Phase 10).
- **Storage:** Supabase Storage bucket `media`, public-read.
- **Fonts:** Cormorant Garamond + IBM Plex Mono via Google Fonts; Helvetica Neue fallback.
- **No build step required** for the prototype itself; you'll want one once Phase 7 starts hydrating content.

## I.4 · The four entities + their relationships

```
   ┌──────────────┐                           ┌──────────────┐
   │     Pen      │ ────── pairings ──────→  │    Paper     │
   │ pen.html     │  ← affinity scores both  │  paper.html  │
   │              │     sides (denorm)        │              │
   │ recommended_ │                           │ recommended_ │
   │ paper_ids[]  │                           │ pen_ids[]    │
   │ affinity_    │                           │ affinity_    │
   │ scores       │                           │ scores       │
   │ {paperId: N} │                           │ {penId:  N}  │
   └──────┬───────┘                           └──────┬───────┘
          │                                          │
          │             ┌──────────────────┐         │
          └──────────→  │     Pairing      │ ←───────┘
                        │  pairing.html    │
                        │  pen_id    (FK)  │
                        │  paper_id  (FK)  │
                        │  scoring{5-axis} │
                        │  measurements    │
                        │  conditions      │
                        │  editorial       │
                        └──────────────────┘

   ┌──────────────┐
   │     Ink      │  recommended_pen_ids[]
   │ ink-detail.  │  recommended_paper_ids[]
   │   html       │  affinity_scores { pen|paper id: N }
   └──────────────┘
```

- A **Pen** has `nib`, `ink_delivery`, `body`, `dimensions`, `ergonomics`, `performance`, `heritage`, `service`, `pricing`, `editorial`, `photos` — all JSONB columns. See §4.
- A **Paper** has `substance`, `surface`, `performance`, `appearance`, `format`, `texture`, `heritage`, `pricing`, `editorial`, `photos`. See §5.
- A **Pairing** has FKs to one pen + one paper, plus `scoring` (five axes + overall), `measurements`, `conditions`, `editorial`. See §6.
- An **Ink** has `color`, `chemistry`, `performance`, `pairing` (recommended pens + papers), `pricing`, `editorial`. See §7.
- **Affinity scores** live as `jsonb` on each side (`pen.affinity_scores = { paper_id: 0–100 }`), denormalised for fast detail-page rendering. The source of truth is the `pairings` table; the JSONB scores are derived.

## I.5 · Routes & click-through map

Already documented exhaustively in **§2** below — skim it before Phase 7 so you know which tile links to which destination.

---

# Part II · The wire-up walkthrough

Work through these phases **in order**. Each ends with a verification step you can run yourself.

## Phase 1 · Create the Supabase project

**Time:** ~5 minutes.

1. Sign up / log in at [supabase.com](https://supabase.com). Create a new project. Pick a region close to your readers. Save the database password somewhere safe.
2. Settings → API. Note these:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **anon public key** (JWT, starts with `eyJ…`)
   - **service_role key** (JWT — admin only, **never ship to the client**)
3. Install the CLI:
   ```bash
   brew install supabase/tap/supabase
   # or
   npm i -g supabase
   ```
4. From this directory:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase init
   ```

**Verify:** `supabase status` shows your project linked.

## Phase 2 · Create the tables

**Time:** ~15 minutes.

All four tables are JSONB-rich — the full DDL is in **§8.1**. You **migrate**, you don't paste-and-run.

1. Create the migration:
   ```bash
   supabase migration new init_schema
   ```
2. Open `supabase/migrations/<timestamp>_init_schema.sql` and paste the entire SQL block from §8.1 (`create table public.pens`, `public.papers`, `public.pairings`, `public.inks` + all their indexes).
3. Apply:
   ```bash
   supabase db push
   ```

**Verify:** Dashboard → Table Editor → confirm all four tables exist with the JSONB columns. Or:
```sql
select tablename from pg_tables where schemaname = 'public';
-- → inks, pairings, papers, pens
```

## Phase 3 · Enable Row Level Security

**Time:** ~5 minutes.

Public read, editor-only write.

1. `supabase migration new init_rls`
2. Paste the policies from **§8.2** (`alter table … enable row level security;` + the `create policy` statements)
3. `supabase db push`

**Verify:**
```ts
const { data } = await sb.from('pens').select('count');     // ok — empty
const { error } = await sb.from('pens').insert({ id: 't' });
// → error.code === '42501' (RLS violation as expected)
```

## Phase 4 · Facet + Sommelier RPC functions

**Time:** ~10 minutes.

Two Postgres functions power the filter UI and the picker.

1. `supabase migration new init_rpc`
2. Paste `pen_facets()`, `paper_facets()`, and `find_pairings(...)` from **§8.4** and **§8.5**. Write a symmetric `ink_facets()` for the Ink Cupboard (same shape as `pen_facets`, grouping by `family`, `hue_family`, `warmth`, and `(performance->>'wetness')::int` bucketed).
3. `supabase db push`

**Verify (pre-seed):**
```sql
select pen_facets();                                    -- → '{}'
select * from find_pairings(72, 22, 82, 34, 60, 12);    -- → empty rows
```

## Phase 5 · Create the Storage bucket

**Time:** ~10 minutes.

1. Dashboard → Storage → **New bucket**. Name: `media`. Public bucket: **yes**.
2. Add a Storage policy (editors only can write):
   ```sql
   create policy "Editors upload to media"
     on storage.objects for insert
     with check (
       bucket_id = 'media'
       and (auth.jwt()->>'role') = 'editor'
     );
   create policy "Editors update media"
     on storage.objects for update
     using (
       bucket_id = 'media'
       and (auth.jwt()->>'role') = 'editor'
     );
   create policy "Media is readable by all"
     on storage.objects for select
     using (bucket_id = 'media');
   ```
3. Use this folder structure — the `photos.*` fields store **paths**, not URLs:
   ```
   media/
     pens/:pen.id/
       hero.png              ← capped, side profile · REQUIRED · transparent PNG
       uncapped.png
       posted.png
       nib-detail.png
       in-hand.jpg           ← editorial, neutral background OK
     papers/:paper.id/
       hero.png              ← REQUIRED · transparent PNG
       against-light.png     ← backlit, shows show-through
       swatch.png            ← tight crop, transparent
       writing-sample.png
     pairings/:pairing.id/
       sample.png            ← the writing sample
     inks/:ink.id/
       bottle.png            ← transparent PNG
       swab.png              ← swatch on standard paper
       writing.png
       sheen-detail.png
   ```
4. **All product photography must be transparent-background PNGs.** The site has a configurable paper-tone backdrop; a white-background photo will look wrong on any non-default palette. Full image specs in **§3**.

The client reads paths and resolves to public URLs:
```ts
const { data: { publicUrl } } = sb.storage.from('media').getPublicUrl(pen.photos.hero);
// → "https://xxxxx.supabase.co/storage/v1/object/public/media/pens/pilot-custom-823/hero.png"
```

**Verify:** Drag a test PNG into `pens/test/hero.png` via the dashboard. Open the public URL in a browser.

## Phase 6 · Seed initial data

**Time:** open-ended. This is the long phase.

The prototype hard-codes **8 pens, 8 papers, 4 pairings, 8 inks**. Each is a complete, schema-valid record waiting to be translated into SQL.

### Workflow per record

For each entity:

1. **Open the HTML file** that has the deepest sample for that entity:
   - Pen: `pen.html` for the Custom 823 full record; `index.html#archive-pens` for the other 7 (tile-level data only)
   - Paper: `paper.html` for Tomoe River; `index.html#archive-papers` for the other 7
   - Pairing: `pairing.html` for № 047 full record; `index.html#pairings` for № 052, № 061, № 074
   - Ink: `ink-detail.html` for Tsuki-yo; `ink.html` for the other 7
2. **Find the section-level comment block** (e.g. `<!-- CLAUDE CODE · ATTRIBUTES SECTION · attr-group `Heritage & Lineage` → pen.heritage … -->`)
3. **Translate each rendered value** into the corresponding schema field
4. **Write the INSERT statement** following the example records (one per schema in §§4–7)

### Records to seed

**8 sample pens** (slugs are the canonical `id`):
| id | Brand | Model | Archive № |
|---|---|---|---|
| `pilot-custom-823`            | Pilot       | Custom 823 (Amber Demonstrator)  | 003 |
| `pelikan-souveran-m800`       | Pelikan     | Souverän M800                     | 011 |
| `lamy-2000`                   | Lamy        | 2000 Bauhaus                      | 024 |
| `sailor-pro-gear-naginata`    | Sailor      | Pro Gear · Naginata               | 038 |
| `aurora-88-anniversary`       | Aurora      | 88 Anniversary                    | 052 |
| `nakaya-portable-heki`        | Nakaya      | Portable · Heki-Tamenuri          | 069 |
| `twsbi-diamond-580-al`        | TWSBI       | Diamond 580 AL                    | 084 |
| `platinum-3776-century-uef`   | Platinum    | #3776 Century UEF                 | 097 |

**8 sample papers**:
| id | Brand | Model | Archive № |
|---|---|---|---|
| `tomoegawa-tomoe-river-s`     | Tomoegawa            | Tomoe River S       | 001 |
| `midori-md-notebook`          | Midori               | MD Notebook         | 008 |
| `rhodia-no-16-dot-pad`        | Rhodia               | № 16 Dot Pad        | 014 |
| `clairefontaine-triomphe`     | Clairefontaine       | Triomphe            | 027 |
| `crown-mill-cotton-laid`      | Original Crown Mill  | Pure Cotton Laid    | 041 |
| `maruman-mnemosyne-197`       | Maruman              | Mnemosyne 197       | 056 |
| `apica-cd-premium`            | Apica                | CD Premium          | 071 |
| `g-lalo-velin-de-france`      | G. Lalo              | Vélin de France     | 088 |

**4 sample pairings** (`is_pairing_of_week = true` only on № 047; `is_editors_choice = true` on № 047 and № 061):
| id | pen_id | paper_id | affinity | use_case | mood | Archive № |
|---|---|---|---|---|---|---|
| `pairing-047` | `pilot-custom-823`    | `tomoegawa-tomoe-river-s` | 94 | Correspondence | Contemplative | 047 |
| `pairing-052` | `lamy-2000`           | `rhodia-no-16-dot-pad`    | 88 | Daily notes    | Crisp         | 052 |
| `pairing-061` | `nakaya-portable-heki`| `crown-mill-cotton-laid`  | 91 | Correspondence | Romantic      | 061 |
| `pairing-074` | `pelikan-souveran-m800`| `apica-cd-premium`       | 82 | Journaling     | Workmanlike   | 074 |

**8 sample inks**:
| id | Brand | Model | Archive № |
|---|---|---|---|
| `iroshizuku-tsuki-yo`         | Pilot · Iroshizuku        | Tsuki-yo             | 014 |
| `diamine-oxblood`             | Diamine                   | Oxblood              | 041 |
| `sailor-yama-dori`            | Sailor                    | Yama-dori            | 028 |
| `kwz-ig-blue-black`           | KWZ Ink                   | Iron Gall Blue-Black | 053 |
| `iroshizuku-take-sumi`        | Pilot · Iroshizuku        | Take-sumi            | 022 |
| `robert-oster-fire-and-ice`   | Robert Oster              | Fire & Ice           | 037 |
| `diamine-magical-forest`      | Diamine · Shimmertastic   | Magical Forest       | 049 |
| `iroshizuku-asa-gao`          | Pilot · Iroshizuku        | Asa-gao              | 019 |

### Affinity scores

After all pens + papers + pairings are inserted, derive the JSONB `affinity_scores` on each side from the pairings table:

```sql
update public.pens p
set affinity_scores = coalesce((
  select jsonb_object_agg(paper_id, affinity_score)
  from public.pairings
  where pen_id = p.id
), '{}'::jsonb);

update public.papers pa
set affinity_scores = coalesce((
  select jsonb_object_agg(pen_id, affinity_score)
  from public.pairings
  where paper_id = pa.id
), '{}'::jsonb);
```

Run this as a final `seed.sql` statement, or wrap it in a trigger if you'll be adding pairings frequently.

### Apply the seed

```bash
supabase db reset             # wipes DB, re-runs migrations + seed
# or, non-destructive:
psql "$DATABASE_URL" -f supabase/seed.sql
```

**Verify:**
```sql
select count(*) from pens;     -- 8
select count(*) from papers;   -- 8
select count(*) from pairings; -- 4
select count(*) from inks;     -- 8
select pen_facets();           -- now returns real bucket counts
select * from find_pairings(72, 22, 82, 34, 60, 12);
                               -- → ranked pairings
```

## Phase 7 · Replace sample HTML, page by page

Pick a templating approach **before** starting:

- **Static + client-side hydration** — fastest to a working site; SEO-weak. Fine for a launch.
- **Astro** — file-based routes, frontmatter for queries, ships zero JS by default. **Recommended.**
- **Next.js (app router)** — overkill for a 6-page site but well-supported.
- **SvelteKit** — rewrite each HTML page as a `+page.svelte` route.

The walkthrough below shows the **queries**; the templating syntax is yours.

For every page: replace `<image-slot id="…">` with `<img src={sb.storage.from('media').getPublicUrl(<photos.field>).data.publicUrl}>`. Drop the `image-slot.js` import.

### Phase 7.1 · index.html

Five hydration zones, in source order:

**Zone A · Featured Pairing of the Week**
```ts
const { data: featured } = await sb
  .from('pairings')
  .select('*, pen:pens(*), paper:papers(*)')
  .eq('is_pairing_of_week', true)
  .single();
```
The field-map comment above `.featured` in index.html lists every value. Image-slots: `hero-pen` → `featured.pen.photos.hero`, `hero-paper` → `featured.paper.photos.hero`.

**Zone B · Principles** (`.principles`)
Static content. Leave as-is unless you want editors to manage them.

**Zone C · Pen Archive** (`.archive-grid#archive-pens`)
```ts
const { data: pens } = await sb.from('pens').select('*')
  .order('archive_number').range(0, 7);
const { data: facets } = await sb.rpc('pen_facets');
```
Render one `.pen-card` per pen. **Keep all the wrapping structure** (`<div class="archive-grid">`, the section header, the filter chips) — only the inner card list is dynamic. Filter chip counts: `facets.nibSize.EF`, `facets.flex.Soft`, etc.

**Zone D · Paper Archive** — same pattern, swap `pens`→`papers`, `pen_facets`→`paper_facets`.

**Zone E · Pairings Catalogue** (`.pairings`)
```ts
const { data: pairings } = await sb.from('pairings')
  .select('*, pen:pens(*), paper:papers(*)')
  .order('affinity_score', { ascending: false })
  .range(0, 3);
```
Each `<a class="pairing">` block becomes `<a href="/pairings/${pairing.id}">…</a>`.

**Compare table** — Phase 9.
**Sommelier picker** — Phase 8.
**Sticky tray** — Phase 9.

### Phase 7.2 · pen.html

Route: `/pens/:id`. Four queries:
```ts
const { data: pen } = await sb.from('pens')
  .select('*').eq('id', id).single();

const topPaperIds = Object.entries(pen.affinity_scores)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 3).map(([id]) => id);
const { data: topPapers } = await sb.from('papers')
  .select('*').in('id', topPaperIds);

const { data: penPairings } = await sb.from('pairings')
  .select('*, pen:pens(*), paper:papers(*)')
  .eq('pen_id', id)
  .order('affinity_score', { ascending: false })
  .limit(3);

const { data: relatedPens } = await sb.from('pens').select('*')
  .filter('nib->>material', 'eq', pen.nib.material)
  .neq('id', id).limit(4);
```

Render each attribute group from `pen.<group>`:
- Group ii. The Nib            ← `pen.nib.*`
- Group iii. Ink Delivery      ← `pen.ink_delivery.*`
- Group iv. Body & Trim        ← `pen.body.*`
- Group v. Dimensions & Weight ← `pen.dimensions.*`
- Group vi. Heritage & Lineage ← `pen.heritage.*` (skip entire group if null)
- Group vii. Service & Provenance ← `pen.service.*` (skip if null)
- Group viii. Ergonomics & Character ← `pen.ergonomics.*` + `pen.performance.*`

Spectrum bars: `<i style="left: ${value}%">` where value is the 0–100 score, or `(score * 20)` for 1–5 scales.

### Phase 7.3 · paper.html

Mirror of 7.2. Same shape, swap pen ↔ paper. Eight attribute groups (Identity, Substance, Surface, Behaviour, Dry Time, Watermark, Mill, Format).

### Phase 7.4 · pairing.html

Route: `/pairings/:id`. One query with embeds:
```ts
const { data: p } = await sb.from('pairings')
  .select('*, pen:pens(*), paper:papers(*)')
  .eq('id', id).single();

const { data: related } = await sb.from('pairings')
  .select('*, pen:pens(id,model), paper:papers(id,model), editorial')
  .or(`pen_id.eq.${p.pen_id},paper_id.eq.${p.paper_id},use_case.eq.${p.use_case}`)
  .neq('id', p.id)
  .order('affinity_score', { ascending: false })
  .limit(3);
```

Render:
- Hero deck (italic line) ← `p.editorial.headline`
- Affinity dial ← `p.affinity_score`
- Pen card → `/pens/${p.pen.id}`
- Paper card → `/papers/${p.paper.id}`
- Writing-sample block: if `p.writing_sample_photo` then `<img>`; else CSS-painted fallback with `p.editorial.tasting_note` as text
- Five axes grid ← `p.scoring.{wetnessAbsorbency, nibSizeTooth, sheenSmoothness, flexSizing, useMood}` (each card's score and dot position)
- Measurements table ← `p.measurements.*`
- Conditions table ← `p.conditions.*`
- Editor's long note: `p.editorial.tasting_note` (paragraphs) + `p.editorial.editorName` (byline) + `p.editorial.tags[]` (chip stack)

### Phase 7.5 · ink.html

Route: `/inks`.
```ts
const { data: inks } = await sb.from('inks').select('*')
  .order('archive_number').range(0, 7);
const { data: facets } = await sb.rpc('ink_facets');
```

Each `.ink-card` uses CSS custom properties:
```ts
style={{
  '--ink-color':     ink.color.oklch ?? ink.color.hex,
  '--ink-shade-low': ink.color.shadingLow,
  '--ink-sheen':     ink.color.sheenHex,
  '--ink-shimmer':   ink.color.shimmerColor,
}}
```

Marks (SHEEN / SHIMMER / I/G / ARCHIVAL) are conditional:
- SHEEN → `ink.performance.sheenVisibility >= 4`
- SHIMMER → `ink.performance.shimmerVisibility >= 1`
- I/G → `ink.family === 'Iron gall'`
- ARCHIVAL → `ink.chemistry.archival === true`

Hue band cells: count from `facets.hueFamily.<key>` — render an empty/grey cell when count is 0.

### Phase 7.6 · ink-detail.html

Route: `/inks/:id`. Same shape as 7.2/7.3.
```ts
const { data: ink } = await sb.from('inks').select('*').eq('id', id).single();

const paperIds = (ink.pairing?.recommended_paper_ids ?? []).slice(0, 3);
const { data: papers } = await sb.from('papers').select('*').in('id', paperIds);

const penIds = (ink.pairing?.recommended_pen_ids ?? []).slice(0, 3);
const { data: pens } = await sb.from('pens').select('*').in('id', penIds);

const { data: inkPairings } = await sb.from('pairings')
  .select('*, pen:pens(*), paper:papers(*)')
  .filter('conditions->>inkUsed', 'eq', ink.model)
  .order('affinity_score', { ascending: false }).limit(3);
```

Six attribute groups (Identity, Colour & Hue tall, Chemistry, Behaviour, Dry Time by Nib, Pairing & Best Use wide).

## Phase 8 · Wire the Sommelier picker

The 5 sliders on `index.html#picker` send their values to `find_pairings()`:

```ts
import debounce from 'lodash.debounce';

const onPickerChange = debounce(async () => {
  const { data } = await sb.rpc('find_pairings', {
    wetness:   sliderValues.wetness,
    tooth:     sliderValues.tooth,
    sheen:     sliderValues.sheen,
    heritage:  sliderValues.heritage,
    occasion:  sliderValues.occasion,
    result_limit: 12,
  });
  renderResults(data);
}, 200);

document.querySelectorAll('.picker input[type=range]')
  .forEach(s => s.addEventListener('input', onPickerChange));
```

The descriptive label above each slider ("Wet" / "Smooth" / "Pronounced" / etc.) is client-side derived — the bucketed-word tables are already in `index.html` at the bottom of the file (see `pickerWords`). Reuse them.

The match-count headline (`<em data-out="count">`) reads `data.length`. If you want a true total (i.e. matches beyond the 12 returned), run a second `count()` query without the limit, or have `find_pairings` return a window-function row total.

## Phase 9 · Wire Compare

The sticky tray (`.tray`) is **client-state only** — persist the selected ID list to `localStorage`:

```ts
const KEY = 'pp.compareIds';
function getSelection()      { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
function setSelection(ids)   { localStorage.setItem(KEY, JSON.stringify(ids.slice(0, 4))); }

// "Add to compare" button on pen / paper detail pages:
function addToCompare(id) { setSelection([...new Set([...getSelection(), id])]); }
```

On "Open compare →":
```ts
window.location = `/compare?ids=${getSelection().join(',')}`;
```

On the compare page (`/compare`):
```ts
const ids = new URLSearchParams(location.search).get('ids')?.split(',') ?? [];
if (!ids.length) redirect('/');

// detect mode by inspecting any one ID
const { data: maybePen } = await sb.from('pens')
  .select('id').eq('id', ids[0]).maybeSingle();
const table = maybePen ? 'pens' : 'papers';

const { data: items } = await sb.from(table)
  .select('*').in('id', ids);
```

Render the existing `.compare-grid` structure, swapping the three hard-coded columns for one column per item in `items`.

Match-row highlighting (`.cmp-row.match`) is client-side — for each row, compare the values across all columns; equal (or within numeric tolerance) → apply the class.

## Phase 10 · Search & recently viewed

The site ships with a global ⌘K command bar (`search.js`, loaded on every page) and a recently-viewed list persisted to `localStorage`. Both are **client-only** in the prototype — the catalogue lives as a hard-coded `CATALOG` array inside `search.js`.

### 10.1 · Replace the in-memory catalogue with a Supabase index

The `CATALOG` constant has 28 entries (8 pens, 8 papers, 4 pairings, 8 inks), each shaped as:
```ts
{ type, id, brand, model, variant, archiveNumber, meta, keywords, visual, url }
```

Two wiring options, by catalogue size:

**(a) Client-cached index** — simplest, works up to ~2 000 entries. Build a Postgres function that unions thin rows from every table:
```sql
create or replace function public.search_index()
returns table (
  type text, id text, archive_number int,
  brand text, model text, variant text,
  meta text, keywords text, visual jsonb, url text
) language sql stable as $$
  select 'pen', id, archive_number, brand, model, variant,
         (nib->>'material') || ' ' || (nib->>'size') || ' · '
           || (ink_delivery->>'fillingSystem') || ' · ' || country_of_origin,
         coalesce(editorial->>'tastingNote','') || ' ' || (nib->>'flex')
           || ' ' || (body->>'material'),
         photos, '/pens/' || id
  from public.pens
  union all
  select 'paper', id, archive_number, brand, model, variant,
         (substance->>'gsm') || ' gsm · ' || (appearance->>'tone')
           || ' · ' || country_of_origin,
         coalesce(editorial->>'tastingNote','') || ' ' || (surface->>'tooth'),
         photos, '/papers/' || id
  from public.papers
  union all
  select 'pairing', id, archive_number, 'Pairing',
         (select brand || ' ' || model from pens where id = p.pen_id) || ' × '
           || (select brand || ' ' || model from papers where id = p.paper_id),
         null, use_case || ' · Affinity ' || affinity_score,
         coalesce(editorial->>'tastingNote',''),
         '{}'::jsonb, '/pairings/' || id
  from public.pairings p
  union all
  select 'ink', id, archive_number, brand, model, model_english,
         hue_family || ' · Sheen ' || (performance->>'sheenVisibility') || '/5',
         coalesce(editorial->>'tastingNote','') || ' ' || family,
         color, '/inks/' || id
  from public.inks;
$$;

-- in search.js (replace the loadCatalog stub):
async function loadCatalog() {
  const { data } = await sb.rpc('search_index');
  return data;
}
```
Cache in IndexedDB; refresh on cold start.

**(b) Server-side full-text** — once the catalogue grows beyond ~2 000 entries:
```sql
alter table public.pens   add column search_tsv tsvector
  generated always as (
    setweight(to_tsvector('english', brand || ' ' || model), 'A') ||
    setweight(to_tsvector('english', coalesce(variant, '') || ' ' || country_of_origin), 'B') ||
    setweight(to_tsvector('english', coalesce(editorial->>'tastingNote', '')), 'C')
  ) stored;
create index pens_tsv_idx on public.pens using gin (search_tsv);
-- repeat for papers, pairings, inks

create or replace function public.search_almanac(q text)
returns table (type text, id text, model text, archive_number int, url text, rank real)
language sql stable as $$
  select 'pen', id, model, archive_number, '/pens/' || id,
         ts_rank(search_tsv, websearch_to_tsquery('english', q)) as rank
    from public.pens where search_tsv @@ websearch_to_tsquery('english', q)
  union all
  -- papers, pairings, inks symmetric --
  order by rank desc limit 30;
$$;
```

### 10.2 · Recently viewed

Kept client-side under `localStorage` key `pp.recentlyViewed` — max 8 entries, most-recent-first. `search.js` records a visit automatically on every detail-page load (it inspects `location.pathname` against the catalogue and stores the matching row). To surface recents elsewhere:

```ts
const recent = window.PenAndPaperSearch.getRecent();
// render a rail of <recent.map(r => <a href={r.url}>{r.model}</a>)>
```

If you'd like recents to follow the reader across devices, swap `localStorage` for a small `viewed` table keyed by `auth.uid()` and write on every detail-page view (requires sign-in).

### 10.3 · Keyboard contract

- `⌘K` / `Ctrl-K` opens the modal from anywhere on the site
- `/` opens the modal too (Slack-style), unless an input is focused
- `Esc` closes
- `↑` / `↓` move selection
- `Enter` opens the highlighted result
- The topbar `Search ⌘K` hint is wired as a clickable trigger on every page

The modal's empty state shows a curated set of suggested queries (`iroshizuku`, `sheen`, `japan`, `laid cotton`, `vacuum`, `14k`) plus the recently-viewed list — wire any UI you add for power users to the same `PenAndPaperSearch` API.

---

## Phase 11 · Editor write UI

The public site is read-only. Editors get a separate admin UI gated by Supabase Auth.

### 10.1 · Editor role

Trigger that sets `role` on the JWT for whitelisted emails:
```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  if new.email = any (array[
    'editor@penandpaper.example',
    'm.hoshino@penandpaper.example'
  ]) then
    update auth.users
       set raw_app_meta_data = raw_app_meta_data || '{"role":"editor"}'::jsonb
     where id = new.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 10.2 · Admin form

Recommended stack:
- Supabase Auth UI for Magic Link sign-in
- React Hook Form / TanStack Form
- One form per entity (Pen / Paper / Pairing / Ink)
- JSONB groups (`nib`, `ink_delivery`, `body`, etc.) rendered as nested `<fieldset>` blocks — mirror the visual structure of the detail pages
- File upload to the `media` bucket; save the resulting path to `photos.*`

### 10.3 · Validation

Encode the TypeScript schemas in `zod`:
- Required fields = the MVR list in §§4–7
- Enum constraints come straight from the schema literal unions
- Use the same zod schema for client and server (Edge Function) validation

## Phase 12 · Deployment

- **Frontend hosting:** Vercel, Netlify, or Cloudflare Pages. Set env vars `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Build command depends on the framework chosen in Phase 7.
- **Custom domain:** add it in your hosting dashboard, **also** under Supabase → Authentication → URL Configuration so Magic Link redirects work.
- **Edge cache:** the archive pages change rarely — a 5-minute TTL CDN cache is fine. Detail pages can be `s-maxage=300, stale-while-revalidate=86400`.
- **Backups:** Supabase Pro includes daily backups. Your `supabase/migrations/` + `supabase/seed.sql` directory is the schema source of truth — commit it to git.
- **Monitoring:** Supabase logs the slow queries. The `find_pairings` and `pen_facets` functions should run in single-digit ms once indexed.

---

# Part III · Reference

The rest of this document is reference material — the original schemas, Supabase DDL, RLS policies, RPC functions, UI conventions, and editorial tone guide. Section numbers (1–13) are stable so you can cite them from PRs and bug reports.

---

## 1 · Stack the frontend assumes

- Static HTML + light vanilla JS. No build step required.
- React + Babel only inside `tweaks.jsx` (design controls).
- `<image-slot>` web component for user-fillable photo slots. Persists drops to a sidecar JSON.
- Fonts: Cormorant Garamond + IBM Plex Mono via Google Fonts; Helvetica Neue fallback for sans.
- All layout in `styles.css`. Component-specific styles live inline in each page's `<style>` block.

The intent on the backend side: **serve JSON conforming to the schemas below**, then either render server-side templates or hydrate the existing HTML structures.

---

## 2 · Routes &amp; click-through map

The site is a small set of pages. Every list tile in the prototype links to its detail page via an `<a>` wrapper — the table below records every clickthrough the user can make and the schema it implies. Reproduce these routes in production (Next.js routes, React Router, whatever) and the rest of the markup is hydration.

### Routes

| URL | Page | Source |
|---|---|---|
| `/` | The Almanac | `index.html` |
| `/pens` | Pen Archive (filtered grid) | `index.html#archive-pens` |
| `/pens/:id` | **Pen detail** | `pen.html` |
| `/papers` | Paper Archive | `index.html#archive-papers` |
| `/papers/:id` | **Paper detail** | `paper.html` |
| `/inks` | The Ink Cupboard | `ink.html` |
| `/inks/:id` | **Ink detail** | `ink-detail.html` |
| `/pairings` | Pairings catalogue | `index.html#pairings` |
| `/pairings/:id` | **Pairing detail** | `pairing.html` |
| `/picker` | The Sommelier (find a pairing) | `index.html#picker` |
| `/compare?ids=…` | Side-by-side | `index.html#compare` |

### Every clickable tile in the prototype

| In page | Element | Destination |
|---|---|---|
| `index.html` | `.pen-card` (archive grid, 8 tiles) | `/pens/:pen.id` |
| `index.html` | `.paper-card` (archive grid, 8 tiles) | `/papers/:paper.id` |
| `index.html` | `a.pairing` (catalogue, 4 tiles) | `/pairings/:pairing.id` |
| `index.html` | `.featured-link` (Pairing of the Week) | `/pairings/:pairing.id` |
| `index.html` | `.picker-result` (Sommelier matches) | `/pairings/:pairing.id` |
| `index.html` | `.tray-slot` (compare flight chips) | (state-only — opens `/compare?ids=…`) |
| `pen.html` | `.sample-card` (writing sample, 3 tiles) | `/papers/:paper.id` (TODO — currently inert) |
| `pen.html` | `.picker-result` (Recommended Marriages) | `/pairings/:pairing.id` |
| `pen.html` | `.related a` (related pens) | `/pens/:pen.id` |
| `paper.html` | `.sample-card` (writing sample, 3 tiles) | `/pens/:pen.id` (TODO — currently inert) |
| `paper.html` | `.picker-result` (Recommended Marriages) | `/pairings/:pairing.id` |
| `paper.html` | `.related-papers a` (related papers) | `/papers/:paper.id` |
| `pairing.html` | `.pp-card` (left, pen specimen) | `/pens/:pen.id` |
| `pairing.html` | `.pp-card` (right, paper specimen) | `/papers/:paper.id` |
| `pairing.html` | `.related-pairings a` | `/pairings/:pairing.id` |
| `ink.html` | `.ink-card` (archive grid, 8 tiles) | `/inks/:ink.id` |

### Detail-page hydration

Each detail page is one Supabase query plus the embedded relationships:

```ts
// pen.html · /pens/:id
const { data: pen }    = await sb.from('pens').select('*').eq('id', id).single();
const { data: pairs }  = await sb.from('pairings')
  .select('*, paper:papers(*)')
  .eq('pen_id', id).order('affinity_score', { ascending: false }).limit(3);
const topPaperIds      = Object.entries(pen.affinity_scores)
                          .sort(([,a],[,b]) => b-a).slice(0,3).map(([id])=>id);
const { data: papers } = await sb.from('papers').select('*').in('id', topPaperIds);

// paper.html · /papers/:id — same shape, swap pen_id ↔ paper_id

// pairing.html · /pairings/:id
const { data: pairing } = await sb.from('pairings')
  .select('*, pen:pens(*), paper:papers(*)')
  .eq('id', id).single();

// ink-detail.html · /inks/:id
const { data: ink } = await sb.from('inks').select('*').eq('id', id).single();
const paperIds      = ink.pairing.recommendedPaperIds?.slice(0,3) ?? [];
const { data: papers } = await sb.from('papers').select('*').in('id', paperIds);
```

---

## 3 · Image requirements — read first

**All product photography must be supplied as transparent-background PNGs.** The site is set on a warm ivory paper background (`oklch(97.2% 0.008 82)`) and changing the background via the Tweaks panel is supported. Photos with white or coloured backgrounds will break against any non-default palette.

Recommended specs:

| Asset class | Format | Dimensions | Notes |
|---|---|---|---|
| Pen, full body, side profile | PNG · transparent | 2400 × 800 px min | Capped; clip toward top |
| Pen, uncapped, posted | PNG · transparent | 2400 × 1200 px min | Posted shot for length reference |
| Pen, nib detail (3/4 view) | PNG · transparent | 1200 × 1200 px | Reads at 600px slot height |
| Pen, in-hand | JPG · neutral background | 2000 × 1500 px | Editorial, only for hero |
| Paper, full sheet | PNG · transparent | 2000 × 2800 px | Sheet held vertically; show texture |
| Paper, against the light | PNG · transparent | 2000 × 2800 px | For show-through demos |
| Paper, swatch tile | PNG · transparent | 600 × 800 px | For archive grids |
| Writing sample (paper + ink) | PNG · transparent OR cream-bg JPG | 2000 × 1400 px | Crop tight to writing |

Transparency notes:
- Knock out backgrounds cleanly, no fringing. A subtle drop shadow may be baked into the PNG.
- Pen barrels: photograph against a neutral grey card, then mask in post.
- Papers: scan the sheet flat on a black background, knock out, leave the paper's own texture visible.
- Writing samples: photograph or scan flat; do not crop into the strokes.

---

## 4 · Pen schema

The pen attribute set. **Required** fields must be present for an entry to publish; the rest are progressive disclosure.

### Minimum viable record — what every pen must have

For a pen to render correctly on `/pens` and `/pens/:id`:

- `id`, `archiveNumber`, `brand`, `model`, `yearIntroduced`, `countryOfOrigin`, `inProduction`
- `nib.size`, `nib.sizeNormalized`, `nib.material`, `nib.flex`, `nib.shape`, `nib.hasBreatherHole`
- `inkDelivery.fillingSystem`, `inkDelivery.flow`
- `body.material`, `body.translucency`, `body.trimColor`, `body.clipType`, `body.capType`
- `dimensions.lengthCappedMm`, `dimensions.lengthUncappedMm`, `dimensions.weightCappedG`
- `ergonomics.postability`
- `performance.smoothness`, `.wetnessScore`, `.lineVariation`, `.hardStarting`, `.skipping`, `.bestUses`, `.mood`
- `pricing.priceTier`
- `editorial.deck`, `editorial.tastingNote`
- `photos.hero` *(transparent PNG path in the `media` storage bucket)*
- `photos.silhouetteId` + `photos.silhouetteColor` as fallback when no hero photo

Everything else (heritage, service, custom grind, etc.) is optional progressive disclosure — fields show in the detail page only when present.

### Full schema

```ts
type Pen = {
  // ── Identity ──────────────────────────────────────────────
  id:                 string;        // slug — "pilot-custom-823"
  archiveNumber:      number;        // "№ 003" in the UI
  brand:              string;        // "Pilot"
  model:              string;        // "Custom 823"
  variant?:           string;        // "Amber Demonstrator"
  yearIntroduced:     number;        // 1992
  yearDiscontinued?:  number | null;
  generation?:        string;        // "Current (2017–)"
  countryOfOrigin:    string;        // "Japan"
  cityOfOrigin?:      string;        // "Hiratsuka"
  edition?: {
    kind: "regular" | "limited" | "special";
    size?: number;                   // edition size if limited
    year?: number;
  };
  inProduction:       boolean;

  // ── Nib ───────────────────────────────────────────────────
  nib: {
    size:             string;        // "M" — use brand's own designation
    sizeNormalized:   "UEF" | "EF" | "F" | "MF" | "M" | "B" | "BB" | "BBB"
                    | "Stub" | "Italic" | "Oblique" | "Architect"
                    | "Music" | "Fude" | "Waverly" | "Posting";
    nibWidthMm?:      number;        // measured tip width (0.30 mm for Pilot UEF)
    material:         "Steel" | "Gold 14k" | "Gold 18k" | "Gold 21k"
                    | "Titanium" | "Palladium" | "Rhodium-plated steel"
                    | "Two-tone";
    goldPurityPct?:   number;        // 585 (14k), 750 (18k), 875 (21k)
    plating?:         string;        // "Rhodium-masked face"
    tipping?:         string;        // "Iridium alloy", "Osmiridium"
    tippingShape?:    "Spherical" | "Cylindrical" | "Faceted";
    tippingGrade?:    string;        // "IPG grade 3" — iridium point grade
    flex:             "Rigid" | "Soft" | "Semi-flex" | "Flex" | "Wet noodle";
    shape:            "Round" | "Italic" | "Stub" | "Oblique"
                    | "Architect" | "Music" | "Fude";
    sizeDesignation?: number;        // physical nib size — #3 through #15
    totalLengthMm?:   number;        // nib body, root to tip
    tineLengthMm?:    number;        // exposed tine length
    slitLengthMm?:    number;        // slit running tip → breather hole
    hasBreatherHole:  boolean;
    breatherHoleMm?:  number;        // diameter
    twoTone?:         boolean;
    imprintSide?:     "Obverse" | "Reverse";
    decoration?:      string;        // "Scroll engraving · shoulders"
    customGrind?:     string;        // "Naginata Togi", "Cursive Italic"
    engraving?:       string;        // text engraved on the nib face
  };

  // ── Ink delivery ──────────────────────────────────────────
  inkDelivery: {
    fillingSystem:    "Cartridge" | "Cartridge/Converter" | "Piston"
                    | "Vacuum (vac-fill)" | "Eyedropper" | "Button"
                    | "Lever" | "Snorkel" | "Bulkfiller" | "Crescent"
                    | "Aerometric" | "Bulb";
    cartridgeStandard?: "Proprietary" | "Standard International (short)"
                      | "Standard International (long)";
    inkCapacityMl?:   number;        // 2.0 for Custom 823
    capacityInPages?: string;        // "~ 32 A5 pages (M nib)"
    fillStroke?:      string;        // "Single plunger · 90 % primed"
    primeTimeSec?:    number;        // seconds to fully prime feed
    shutOffValve?:    boolean;       // true for vacs with a valve
    feedMaterial?:    "Plastic" | "Ebonite" | "3D-printed";
    feedVisibility?:  string;        // "Visible through demonstrator"
    inkWindow?:       string;        // "Whole barrel" / "Side window" / "None"
    flow:             "Dry" | "Medium" | "Wet" | "Very wet";
    flowScore?:       number;        // 0–100 for the spectrum bar
  };

  // ── Body ──────────────────────────────────────────────────
  body: {
    material:         "Resin" | "Acrylic" | "Ebonite" | "Hard rubber"
                    | "Celluloid" | "Urushi" | "Maki-e"
                    | "Aluminum" | "Brass" | "Steel" | "Sterling silver"
                    | "Titanium" | "Wood" | "Makrolon" | "Pearl";
    densityGcm3?:     number;        // material density
    finish?:          string;        // "Heki-Tamenuri", "Brushed"
    color?:           string;        // free text — "Amber translucent"
    colorHex?:        string;        // for swatch rendering
    translucency:     "Opaque" | "Semi-translucent" | "Demonstrator";
    trimColor:        "Gold" | "Silver/Rhodium" | "Black"
                    | "Bronze" | "Raw" | "Two-tone" | "None";
    finialDescription?: string;      // "Resin dome · gold accent ring"
    clipType:         "Sprung" | "Fixed" | "Roll-stop" | "Clipless";
    capType:          "Screw" | "Snap" | "Magnetic";
    capTurns?:        number;        // turns to uncap (1.0, 1.5, 2.0…)
    capThreads?:      string;        // "Triple-start · 28 TPI"
    capInteriorSeal?: string;        // "Inner cap · silicone seal"
    sectionMaterial?: string;        // "Black resin"
  };

  // ── Dimensions & ergonomics ──────────────────────────────
  dimensions: {
    lengthCappedMm:        number;
    lengthUncappedMm:      number;
    lengthPostedMm?:       number;
    capLengthMm?:          number;
    barrelLengthMm?:       number;
    diameterGripMm?:       number;
    diameterMaxMm?:        number;
    diameterCapMm?:        number;
    weightCappedG:         number;
    weightUncappedG?:      number;
    weightCapOnlyG?:       number;
    weightPostedG?:        number;
    balancePointPct?:      number;   // % from nib, unposted; 50 = balanced
  };
  ergonomics: {
    postability:      "Excellent" | "Good" | "Awkward" | "Top-heavy" | "Doesn't post";
    sectionShape?:    "Cylindrical" | "Tapered" | "Concave" | "Stepped";
    threadsAtGrip?:   "Smooth" | "Light" | "Sharp";   // section thread feel
    balanceNote?:     string;
    leftHandFriendly?: boolean;
  };

  // ── Performance & character (editor-scored) ──────────────
  performance: {
    smoothness:       number;       // 1–10
    wetnessScore:     number;       // 0–100, see flowScore
    lineVariation:    "None" | "Slight" | "Moderate" | "Marked";
    hardStarting:     number;       // 1–5 (1 = never)
    skipping:         number;       // 1–5
    dryOutDays?:      number;       // uncapped days before dry-out
    bestUses:         Array<"Correspondence" | "Journaling" | "Sketching"
                          | "Calligraphy" | "Daily notes" | "Signatures"
                          | "Marginalia">;
    mood:             Array<"Contemplative" | "Crisp" | "Romantic"
                          | "Workmanlike" | "Showy" | "Quiet">;
  };

  // ── Heritage & lineage ───────────────────────────────────
  heritage?: {
    designer?:         string;       // "Bauhaus team" / "Pilot R&D"
    yearDesigned?:     number;
    predecessor?:      string;       // model name of predecessor
    family?:           string;       // "Pilot Custom series"
    sisterModels?:     string[];     // model ids in the same family
    limitedEditions?:  string;       // free text — "Four to date"
    originalMsrp?:     string;       // "¥ 30 000 (1992)"
    notableOwners?:    string;       // editorial free text
  };

  // ── Service & provenance ─────────────────────────────────
  service?: {
    warranty?:           string;     // "1 year · international"
    serviceCenters?:     string[];   // ISO country codes — ["JP","US","DE"]
    nibExchangePolicy?:  string;     // "By return — no swap"
    spareNibPrice?:      string;     // "¥ 12 000"
    spareNibLeadTime?:   string;     // "6 weeks"
    countryOfDesign?:    string;
    countryOfAssembly?:  string;
    boxedContents?:      string[];   // ["Pen","Silicone grease","Manual"]
    converterIncluded?:  boolean;
    inkSampleIncluded?:  boolean;
    certificate?:        boolean;    // limited-edition certificate
  };

  // ── Commercial ───────────────────────────────────────────
  pricing: {
    msrpUsd?:         number;
    msrpEur?:         number;
    msrpJpy?:         number;
    priceTier:        "I" | "II" | "III" | "IV" | "V";    // $ – $$$$$
    streetPriceUsd?:  number;
  };

  // ── Editorial ────────────────────────────────────────────
  editorial: {
    deck:             string;       // one-sentence pitch (max ~140 char)
    tastingNote:      string;       // 80–200 word writing experience
    editorNote?:      string;       // shorter aside
    recommendedInks?: string[];     // ink ids
    notableUsers?:    string;       // optional history
  };

  // ── Pairing data ─────────────────────────────────────────
  recommendedPaperIds: string[];     // paper.id[] — sorted by affinity desc
  affinityScores: Record<string, number>;   // { paperId: 0–100 }

  // ── Media ────────────────────────────────────────────────
  photos: {
    hero?:        string;            // capped, side profile — REQUIRED for detail page
    uncapped?:    string;
    posted?:      string;
    nibDetail?:   string;
    inHand?:      string;
    silhouetteId?: "pen-classic" | "pen-cigar" | "pen-flat"
                 | "pen-vintage" | "pen-faceted";   // SVG fallback if no photo
    silhouetteColor?: string;        // oklch() string
  };
};
```

### Pen — example record (truncated)

```json
{
  "id": "pilot-custom-823",
  "archiveNumber": 3,
  "brand": "Pilot",
  "model": "Custom 823",
  "variant": "Amber Demonstrator",
  "yearIntroduced": 1992,
  "countryOfOrigin": "Japan",
  "cityOfOrigin": "Hiratsuka",
  "inProduction": true,
  "nib": {
    "size": "M",
    "sizeNormalized": "M",
    "nibWidthMm": 0.55,
    "material": "Gold 14k",
    "tipping": "Iridium alloy",
    "flex": "Soft",
    "shape": "Round",
    "sizeDesignation": 5,
    "hasBreatherHole": true,
    "twoTone": false
  },
  "inkDelivery": {
    "fillingSystem": "Vacuum (vac-fill)",
    "cartridgeStandard": "Proprietary",
    "inkCapacityMl": 2.0,
    "shutOffValve": true,
    "feedMaterial": "Plastic",
    "flow": "Wet",
    "flowScore": 82
  },
  "performance": {
    "smoothness": 9,
    "wetnessScore": 82,
    "lineVariation": "Moderate",
    "hardStarting": 1,
    "skipping": 1,
    "dryOutDays": 5,
    "bestUses": ["Correspondence", "Journaling"],
    "mood": ["Contemplative"]
  }
}
```

---

## 5 · Paper schema

### Minimum viable record — what every paper must have

- `id`, `archiveNumber`, `brand`, `model`, `countryOfOrigin`, `inProduction`
- `substance.gsm`, `.opacity`, `.pulpSource`, `.acidFree`, `.archival`
- `surface.tooth`, `.toothScore`, `.finish`, `.sizing`
- `performance.featheringTendency`, `.bleedThroughTendency`, `.showThroughTendency`, `.sheenVisibility`, `.shadingVisibility`, `.shimmerVisibility`, `.bestForFlow`, `.bestForNibSize`, `.doubleSided`
- `appearance.tone`, `.warmth`, `.colorHex`, `.swatchClass`
- `format.kind`, `.sizesAvailable`, `.rulingsAvailable`
- `editorial.deck`, `.tastingNote`
- `photos.hero` *(transparent PNG)*

### Full schema

```ts
type Paper = {
  // ── Identity ──────────────────────────────────────────────
  id:                 string;
  archiveNumber:      number;
  brand:              string;        // "Tomoegawa"
  model:              string;        // "Tomoe River S"
  variant?:           string;        // "Loose A5"
  mill?:              string;        // "Sanzen (current production)"
  countryOfOrigin:    string;
  yearIntroduced?:    number;
  inProduction:       boolean;
  successorOf?:       string;        // paper.id this replaced (Tomoe River → S)

  // ── Substance ────────────────────────────────────────────
  substance: {
    gsm:              number;        // 52
    caliperMicrons?:  number;        // sheet thickness in µm
    bulkCm3g?:        number;        // cm³ / g — caliper relative to weight
    opacity:          number;        // 1–10 (10 = opaque)
    pulpSource:       "Wood pulp" | "Cotton" | "Bamboo" | "Rice" | "Blended" | "Recycled";
    cottonContentPct?: number;       // 0–100
    recycledContentPct?: number;
    acidFree:         boolean;
    archival:         boolean;
    ph?:              number;        // 7.0 ish
    lignin?:          "None" | "Trace" | "Low" | "Moderate" | "High";
    ashContentPct?:   number;        // mineral filler, calcium carbonate
    brightnessIso?:   number;        // ISO 2470
    brightnessCie?:   number;        // CIE whiteness
    lab?: { l: number; a: number; b: number };  // colour space
    opticalBrighteners?: boolean;    // OBA presence
  };

  // ── Surface ──────────────────────────────────────────────
  surface: {
    tooth:            "Glass" | "Polished" | "Smooth" | "Sized"
                    | "Soft tooth" | "Toothy" | "Coarse";
    toothScore:       number;        // 0–100 for spectrum bar
    finish:           "Vellum" | "Laid" | "Wove" | "Satin" | "Matte"
                    | "Hot-press" | "Cold-press" | "Calendered";
    sizing:           "None" | "Light internal" | "Heavy internal"
                    | "Light surface" | "Heavy surface" | "Extreme surface";
    coating?:         "Uncoated" | "Lightly coated" | "Heavily coated";
    // Lab smoothness / porosity / absorbency — optional, when measured
    bekkSec?:         number;        // Bekk smoothness, seconds
    sheffieldVal?:    number;        // Sheffield smoothness
    gurleySec?:       number;        // Gurley porosity, sec / 100 ml
    cobb60Gm2?:       number;        // Cobb test, g / m² at 60 s
    gloss75Pct?:      number;        // gloss at 75°
    moistureContentPct?: number;     // at 50 % RH
    grainDirection?:  "Long-grain" | "Short-grain";
    deckleEdge?:      "None" | "One side" | "Two sides" | "All four";
  };

  // ── Behaviour with fountain pen ink ──────────────────────
  performance: {
    featheringTendency:   number;    // 1–5 (1 = none)
    bleedThroughTendency: number;    // 1–5
    showThroughTendency:  number;    // 1–5 (ghosting)
    sheenVisibility:      number;    // 1–5 (higher = pronounced)
    shadingVisibility:    number;    // 1–5
    shimmerVisibility:    number;    // 1–5
    dryTimeSecByNib: {               // ink: standard test ink (Iroshizuku Tsuki-yo)
      EF?: number;
      F?: number;
      M?: number;
      B?: number;
      BB?: number;
    };
    bestForFlow:      Array<"Dry" | "Medium" | "Wet" | "Very wet">;
    bestForNibSize:   Array<"EF" | "F" | "M" | "B" | "BB" | "Stub" | "Flex">;
    doubleSided:      boolean;        // recommended for both sides?
  };

  // ── Tone & appearance ────────────────────────────────────
  appearance: {
    tone:             "Bright white" | "White" | "Off-white" | "Ivory"
                    | "Cream" | "Toned" | "Natural";
    warmth:           "Cool" | "Neutral" | "Warm";
    colorHex:         string;          // for swatch rendering
    brightness?:      number;          // CIE brightness 0–100
    swatchClass:      "bright" | "ivory" | "cream";  // CSS class for archive tile
    overlayPattern?:  "blank" | "ruled" | "dot" | "grid" | "laid" | "music";
  };

  // ── Format & binding ─────────────────────────────────────
  format: {
    kind:             "Notebook" | "Loose-leaf" | "Pad" | "Padfolio"
                    | "Scroll/roll" | "Postcard" | "Envelope" | "Sheet";
    sheetCount?:      number;
    binding?:         "Case-bound" | "Perfect" | "Stapled"
                    | "Wire-bound" | "Spiral" | "Gummed top"
                    | "Glued top" | "Thread" | "Smyth-sewn"
                    | "Disc-bound" | "None";
    laysFlat?:        boolean;
    sizesAvailable:   Array<"A3" | "A4" | "A5" | "A6" | "B5" | "B6"
                          | "Letter" | "Legal" | "Standard TN"
                          | "Pocket TN" | "Half-letter" | "Custom">;
    dimensionsMm?: { width: number; height: number };
    rulingsAvailable: Array<"Blank" | "Lined/Ruled" | "Dot grid"
                          | "Square grid" | "Music" | "Graph"
                          | "Cornell" | "Isometric">;
    lineSpacingMm?:   number;          // 5, 6, 7…
  };

  // ── Watermark & texture ──────────────────────────────────
  texture?: {
    watermark?:        string;         // "Crown · centred" or null
    chainLines?:       string;         // "Visible · 25 mm" or "Not visible"
    laidLines?:        string;         // "Visible · 1 mm" or "Wove"
    formation?:        "Uniform" | "Cloudy" | "Cottony" | "Mottled";
    feltSide?:         string;         // descriptive
    wireSide?:         string;
    textureRating?:    number;         // 1–10 — same as surface.toothScore/10
    embossing?:        string;         // "None" | "Crest top-right" …
    edgeTreatment?:    "Square cut" | "Deckle" | "Perforated" | "Mould edge";
  };

  // ── Mill & manufacturing heritage ────────────────────────
  heritage?: {
    millFounded?:        number;
    originalMaker?:      string;       // "Tomoegawa Co. Ltd"
    currentMaker?:       string;       // "Sanzen Paper Co."
    machineType?:        "Fourdrinier" | "Cylinder mould" | "Mould-made"
                       | "Handmade" | "Twin-wire";
    machineSpeedMmin?:   number;       // m / min
    fscCert?:            string;       // "Mix · FSC-C012345" or null
    pefcCert?:           string;
    iso9706?:            boolean;      // archival certified
    carbonFootprintKgCo2e?: number;    // kg CO₂e per kg of paper
    pulping?:            "ECF" | "TCF" | "PCF" | "Kraft" | "Sulfite" | "Mechanical";
  };

  // ── Commercial ───────────────────────────────────────────
  pricing: {
    priceTier:        "I" | "II" | "III" | "IV" | "V";
    msrpEur?:         number;
    msrpUsd?:         number;
    msrpJpy?:         number;
    pricePerSheet?:   number;          // for loose-leaf
    pack?: { quantity: number; priceUsd: number };
  };

  // ── Editorial ────────────────────────────────────────────
  editorial: {
    deck:             string;
    tastingNote:      string;
    editorNote?:      string;
    careNote?:        string;          // "Store sealed — Tomoe is hygroscopic"
  };

  // ── Pairing data ─────────────────────────────────────────
  recommendedPenIds: string[];
  affinityScores:    Record<string, number>;   // { penId: 0–100 }

  // ── Media ────────────────────────────────────────────────
  photos: {
    hero?:           string;          // sheet on neutral — REQUIRED
    againstLight?:   string;          // backlit, shows show-through
    swatch?:         string;          // tight swatch, transparent
    detail?:         string;          // detail of texture / fibre
    writingSample?:  string;          // standardized ink test
  };
};
```

---

## 6 · Pairing schema

### Minimum viable record

- `id`, `archiveNumber`, `penId`, `paperId`, `affinityScore`, `useCase`, `mood[]`
- `scoring.{wetnessAbsorbency, nibSizeTooth, sheenSmoothness, flexSizing, useMood, overall}` — all five axes + overall
- `measurements.{dryTimeSec, bleed, ghosting, feathering, showThrough, sheenObserved}`
- `conditions.inkUsed`
- `editorial.headline`, `.tastingNote`
- `isEditorsChoice` (default false)

### Full schema

```ts
type Pairing = {
  id:                  string;
  archiveNumber:       number;            // "Pairing № 047"
  penId:               string;
  paperId:             string;
  affinityScore:       number;            // 0–100
  useCase:             "Correspondence" | "Journaling" | "Sketching"
                     | "Calligraphy" | "Daily notes" | "Marginalia";
  mood:                Array<"Contemplative" | "Crisp" | "Romantic"
                           | "Workmanlike" | "Showy" | "Quiet">;
  isEditorsChoice:     boolean;
  isPairingOfTheWeek?: boolean;
  scoring: {
    wetnessAbsorbency: number;            // 0–100, how well matched on this axis
    nibSizeTooth:      number;
    sheenSmoothness:   number;
    flexSizing:        number;
    useMood:           number;
    overall:           number;
  };
  measurements: {
    dryTimeSec:        number;
    bleed:             "None" | "Negligible" | "Visible" | "Heavy";
    ghosting:          "None" | "Slight" | "Moderate" | "Heavy";
    feathering:        "Nil" | "Trace" | "Visible" | "Heavy";
    showThrough:       "None" | "Slight" | "Moderate" | "Heavy";
    sheenObserved:     "None" | "Quiet" | "Visible" | "Pronounced" | "Mirror";
  };
  conditions: {
    inkUsed:           string;            // "Iroshizuku Tsuki-yo"
    lightingK?:        number;            // 2700
    rhPct?:            number;            // relative humidity
    tempC?:            number;
    hour?:             string;            // "21:14"
    photographedAt?:   number;            // angle in degrees
  };
  editorial: {
    headline:          string;            // "A wet vacuum-filler finds…"
    tastingNote:       string;
    editorNote?:       string;
    editorName?:       string;            // "M. Hoshino"
    tags:              string[];
  };
  writingSamplePhoto?: string;
};
```

---

## 7 · Ink schema (Phase 2 — the cupboard)

The prototype includes `ink.html` — the Ink Cupboard. The schema is comprehensive; field semantics parallel the pen/paper structure so all three are filterable, sortable, and pairable together.

### Minimum viable record

- `id`, `archiveNumber`, `brand`, `model`, `family`, `hueFamily`, `warmth`, `countryOfOrigin`, `inProduction`
- `color.hex`, `color.name`
- `chemistry.waterResistant`, `.permanent`, `.archival`, `.maintenanceDemand`, `.safeForDemonstrator`
- `performance.wetness`, `.saturation`, `.shadingVisibility`, `.sheenVisibility`, `.shimmerVisibility`, `.dryTimeBaseSec`
- `pairing.bestForUse[]`
- `pricing.priceTier`
- `editorial.deck`, `.tastingNote`

### Full schema

```ts
type Ink = {
  // ── Identity ─────────────────────────────────────────────
  id:                   string;       // "iroshizuku-tsuki-yo"
  archiveNumber:        number;       // "№ 014" in the UI
  brand:                string;       // "Pilot Iroshizuku"
  model:                string;       // "Tsuki-yo"
  modelEnglish?:        string;       // "Moonlit Night"
  variant?:             string;       // edition or year
  countryOfOrigin:      string;
  yearIntroduced?:      number;
  inProduction:         boolean;

  // ── Family & character ───────────────────────────────────
  family:               "Pigment" | "Dye" | "Iron gall" | "Shimmer"
                      | "Sheening" | "Standard" | "Bulletproof" | "Mixable";
  subfamily?:           string;       // "Everyday" / "Archival" / "Artistic"
  hueFamily:            "Blue" | "Black" | "Blue-black" | "Green"
                      | "Teal" | "Red" | "Burgundy" | "Brown" | "Orange"
                      | "Yellow" | "Purple" | "Pink" | "Grey";
  warmth:               "Cool" | "Neutral" | "Warm";

  // ── Colour ───────────────────────────────────────────────
  color: {
    hex:                string;        // primary observed hex (M nib, cream paper)
    oklch?:             string;        // "oklch(28% 0.07 255)"
    name:               string;        // marketing colour name (often same as model)
    shadingHigh?:       string;        // hex at light troughs
    shadingLow?:        string;        // hex at dark pools
    sheenHex?:          string;        // observed sheen colour
    sheenAngleDeg?:     number;        // angle at which sheen appears
    shimmerColor?:      string;
    shimmerSize?:       "Fine" | "Medium" | "Coarse";
    wetDryShiftDelta?:  number;        // 0–100 — how much the colour changes
                                       // between wet and dry
  };

  // ── Chemistry ────────────────────────────────────────────
  chemistry?: {
    ph?:                number;        // typical fountain-pen ink ~ 6–8
    viscosityCp?:       number;        // centipoise at 20 °C
    surfaceTensionMnm?: number;        // mN/m
    dyePct?:            number;        // dye loading
    pigmentPct?:        number;        // pigment loading (if pigment ink)
    waterResistant:     "None" | "Some" | "Most" | "Bulletproof";
    permanent:          boolean;
    archival:           boolean;       // ISO 11798 fade resistance
    bleachResistant:    boolean;
    maintenanceDemand:  "Low" | "Medium" | "High";   // staining, clogging risk
    safeForDemonstrator: boolean;      // staining tendency on clear resin
  };

  // ── Behaviour on the page ────────────────────────────────
  performance: {
    wetness:            number;        // 0–100
    saturation:         number;        // 0–100
    shadingVisibility:  number;        // 1–5
    sheenVisibility:    number;        // 1–5
    shimmerVisibility:  number;        // 1–5
    feathering:         number;        // 1–5 (on standard cream)
    ghosting:           number;        // 1–5
    bleedTendency:      number;        // 1–5
    dryTimeBaseSec:     number;        // M nib on standard test paper
    dryTimeByNib?: {
      EF?: number; F?: number; M?: number; B?: number; BB?: number;
    };
    behaviourOnCream?:  string;        // editorial — "richer, sheens more"
    behaviourOnBright?: string;        // editorial — "crisper, sheen muted"
  };

  // ── Pairing ──────────────────────────────────────────────
  pairing: {
    bestForNibSize?:    Array<"EF" | "F" | "M" | "B" | "BB" | "Stub" | "Flex">;
    bestForPaperTone?:  Array<"Bright white" | "Ivory" | "Cream">;
    bestForUse?:        Array<"Correspondence" | "Journaling" | "Sketching"
                            | "Calligraphy" | "Daily notes" | "Signatures">;
    recommendedPenIds?:   string[];
    recommendedPaperIds?: string[];
    affinityScores?:    Record<string, number>;  // { paperId | penId: 0–100 }
  };

  // ── Commercial ───────────────────────────────────────────
  pricing?: {
    bottleMl:           number;        // 30, 50, 60, 80, 100
    bottleShape?:       "Iroshizuku" | "Round" | "Square" | "Inkwell"
                      | "Bauhaus" | "Cone" | "Wide-mouth";
    msrpUsd?:           number;
    msrpEur?:           number;
    msrpJpy?:           number;
    pricePerMlUsd?:     number;
    priceTier:          "I" | "II" | "III" | "IV" | "V";
  };

  // ── Editorial ────────────────────────────────────────────
  editorial: {
    deck:               string;        // one-sentence pitch
    tastingNote:        string;        // 80–200 word colour + character read
    colorStory?:        string;        // "Named for the moon as seen from a window…"
    editorNote?:        string;
    whenToUse?:         string;
    whenToAvoid?:       string;
  };

  // ── Media ────────────────────────────────────────────────
  photos: {
    bottleHero?:        string;        // bottle photograph, transparent PNG
    swabHero?:          string;        // colour swab on standard paper
    writingSample?:     string;
    sheenDetail?:       string;        // macro at sheen-revealing angle
  };
};
```

### Supabase table

```sql
create table public.inks (
  id                  text primary key,
  archive_number      int not null unique,
  brand               text not null,
  model               text not null,
  model_english       text,
  variant             text,
  country_of_origin   text not null,
  year_introduced     int,
  in_production       boolean not null default true,

  family              text not null,
  subfamily           text,
  hue_family          text not null,
  warmth              text not null,

  color               jsonb not null,                  -- Ink['color']
  chemistry           jsonb,                           -- Ink['chemistry']
  performance         jsonb not null,                  -- Ink['performance']
  pairing             jsonb not null,                  -- Ink['pairing']
  pricing             jsonb,
  editorial           jsonb not null,
  photos              jsonb not null,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create index inks_family_idx     on public.inks (family);
create index inks_hue_idx        on public.inks (hue_family);
create index inks_warmth_idx     on public.inks (warmth);
create index inks_wetness_idx    on public.inks (((performance->>'wetness')::int));
create index inks_sheen_idx      on public.inks (((performance->>'sheenVisibility')::int));
create index inks_archive_idx    on public.inks (archive_number);
```

---

## 8 · Supabase data model

This project does not use a hand-rolled REST API. The frontend reads directly from **Supabase** via `@supabase/supabase-js`. Auth is anonymous by default; writes are gated by Row Level Security.

### 8.1 · Tables (one schema, public)

Three core tables, plus `inks` for Phase 2. The richer nested objects from the TypeScript schemas above live as **`jsonb` columns** — that gives you full read flexibility without an explosion of join tables. Indexes on the keys you facet on.

```sql
-- pens
create table public.pens (
  id                   text primary key,                  -- slug
  archive_number       int  not null unique,
  brand                text not null,
  model                text not null,
  variant              text,
  year_introduced      int  not null,
  year_discontinued    int,
  generation           text,
  country_of_origin    text not null,
  city_of_origin       text,
  edition              jsonb,
  in_production        boolean not null default true,

  nib                  jsonb not null,                    -- Pen['nib']
  ink_delivery         jsonb not null,                    -- Pen['inkDelivery']
  body                 jsonb not null,                    -- Pen['body']
  dimensions           jsonb not null,                    -- Pen['dimensions']
  ergonomics           jsonb,
  performance          jsonb not null,                    -- Pen['performance']
  heritage             jsonb,                             -- Pen['heritage']
  service              jsonb,                             -- Pen['service']
  pricing              jsonb not null,
  editorial            jsonb not null,
  photos               jsonb not null,                    -- {hero, uncapped, …}

  recommended_paper_ids text[] default '{}',
  affinity_scores       jsonb default '{}'::jsonb,        -- { paper_id: 0–100 }

  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- indexes for the facets used on /pens
create index pens_brand_idx          on public.pens (brand);
create index pens_country_idx        on public.pens (country_of_origin);
create index pens_nib_size_idx       on public.pens ((nib->>'sizeNormalized'));
create index pens_nib_material_idx   on public.pens ((nib->>'material'));
create index pens_nib_flex_idx       on public.pens ((nib->>'flex'));
create index pens_filler_idx         on public.pens ((ink_delivery->>'fillingSystem'));
create index pens_body_material_idx  on public.pens ((body->>'material'));
create index pens_price_tier_idx     on public.pens ((pricing->>'priceTier'));
create index pens_flow_score_idx     on public.pens (((ink_delivery->>'flowScore')::int));
create index pens_archive_idx        on public.pens (archive_number);

-- papers — same shape
create table public.papers (
  id                   text primary key,
  archive_number       int not null unique,
  brand                text not null,
  model                text not null,
  variant              text,
  mill                 text,
  country_of_origin    text not null,
  year_introduced      int,
  in_production        boolean not null default true,
  successor_of         text references public.papers(id),

  substance            jsonb not null,
  surface              jsonb not null,
  performance          jsonb not null,
  appearance           jsonb not null,
  format               jsonb not null,
  texture              jsonb,                              -- Paper['texture']
  heritage             jsonb,                              -- Paper['heritage']
  pricing              jsonb,
  editorial            jsonb not null,
  photos               jsonb not null,

  recommended_pen_ids  text[] default '{}',
  affinity_scores      jsonb  default '{}'::jsonb,

  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);
create index papers_gsm_idx        on public.papers (((substance->>'gsm')::int));
create index papers_tooth_idx      on public.papers ((surface->>'tooth'));
create index papers_tone_idx       on public.papers ((appearance->>'tone'));
create index papers_swatch_idx     on public.papers ((appearance->>'swatchClass'));
create index papers_format_kind_idx on public.papers ((format->>'kind'));

-- pairings — pen × paper, with embedded score vector
create table public.pairings (
  id                  text primary key,
  archive_number      int  not null unique,
  pen_id              text not null references public.pens(id)   on delete cascade,
  paper_id            text not null references public.papers(id) on delete cascade,
  affinity_score      int  not null check (affinity_score between 0 and 100),
  use_case            text not null,
  mood                text[] not null default '{}',
  is_editors_choice   boolean not null default false,
  is_pairing_of_week  boolean not null default false,

  scoring             jsonb not null,           -- {wetnessAbsorbency, …, overall}
  measurements        jsonb not null,
  conditions          jsonb not null,
  editorial           jsonb not null,
  writing_sample_photo text,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create unique index pairings_pen_paper on public.pairings (pen_id, paper_id);
create index pairings_affinity on public.pairings (affinity_score desc);
create index pairings_usecase  on public.pairings (use_case);
create index pairings_pofw     on public.pairings (is_pairing_of_week) where is_pairing_of_week = true;

-- inks (Phase 2)
create table public.inks (
  id            text primary key,
  brand         text not null,
  model         text not null,
  family        text not null,
  color         jsonb not null,
  properties    jsonb not null,
  recommended_paper_ids text[] default '{}',
  created_at    timestamptz default now()
);
```

### 8.2 · Row Level Security

Read-only public catalogue:

```sql
alter table public.pens     enable row level security;
alter table public.papers   enable row level security;
alter table public.pairings enable row level security;
alter table public.inks     enable row level security;

create policy "Pens are readable by everyone"     on public.pens     for select using (true);
create policy "Papers are readable by everyone"   on public.papers   for select using (true);
create policy "Pairings are readable by everyone" on public.pairings for select using (true);
create policy "Inks are readable by everyone"     on public.inks     for select using (true);

-- writes are limited to authenticated editors (custom claim or service role only)
create policy "Editors write pens"     on public.pens     for all using (auth.jwt()->>'role' = 'editor');
create policy "Editors write papers"   on public.papers   for all using (auth.jwt()->>'role' = 'editor');
create policy "Editors write pairings" on public.pairings for all using (auth.jwt()->>'role' = 'editor');
```

### 8.3 · Client queries (per section of the frontend)

```ts
import { createClient } from '@supabase/supabase-js';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── index.html#archive-pens ────────────────────────────────────────────
const { data: pens } = await sb
  .from('pens')
  .select('*')
  .order('archive_number', { ascending: true })
  .range(0, 7);                                  // .limit(8) with offset support

// ── index.html#archive-papers ──────────────────────────────────────────
const { data: papers } = await sb
  .from('papers')
  .select('*')
  .order('archive_number', { ascending: true })
  .range(0, 7);

// ── index.html#pairings (catalog) ──────────────────────────────────────
const { data: pairings } = await sb
  .from('pairings')
  .select(`*,
           pen:pens(id, brand, model, variant, nib, ink_delivery, photos),
           paper:papers(id, brand, model, substance, appearance, photos)`)
  .order('affinity_score', { ascending: false })
  .range(0, 3);

// ── index.html · Pairing of the Week (featured hero) ───────────────────
const { data: featured } = await sb
  .from('pairings')
  .select(`*, pen:pens(*), paper:papers(*)`)
  .eq('is_pairing_of_week', true)
  .single();

// ── pen.html · single pen detail ───────────────────────────────────────
const { data: pen } = await sb
  .from('pens')
  .select('*')
  .eq('id', params.id)
  .single();

// pen.html · "On the page" — top 3 papers by this pen's affinity_scores
const topPaperIds = Object.entries(pen.affinity_scores)
  .sort(([,a],[,b]) => b - a).slice(0, 3).map(([id]) => id);
const { data: topPapers } = await sb
  .from('papers')
  .select('*')
  .in('id', topPaperIds);

// pen.html · "Recommended marriages" — pairings featuring this pen
const { data: penPairings } = await sb
  .from('pairings')
  .select(`*, pen:pens(*), paper:papers(*)`)
  .eq('pen_id', params.id)
  .order('affinity_score', { ascending: false })
  .limit(3);

// paper.html · symmetric to pen.html, swap pen_id → paper_id

// pairing.html · single pairing detail with both specimens
const { data: pairing } = await sb
  .from('pairings')
  .select(`*, pen:pens(*), paper:papers(*)`)
  .eq('id', params.id)
  .single();
```

### 8.4 · Faceting (Postgres function)

The filter chips above each archive show **counts** per bucket. A Postgres function returns the facet payload in one round-trip:

```sql
create or replace function public.pen_facets()
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'nibSize',          (select jsonb_object_agg(k, c) from (
                          select nib->>'sizeNormalized' k, count(*) c from public.pens
                          group by 1) t),
    'nibMaterial',      (select jsonb_object_agg(k, c) from (
                          select nib->>'material' k, count(*) c from public.pens
                          group by 1) t),
    'fillingSystem',    (select jsonb_object_agg(k, c) from (
                          select ink_delivery->>'fillingSystem' k, count(*) c from public.pens
                          group by 1) t),
    'bodyMaterial',     (select jsonb_object_agg(k, c) from (
                          select body->>'material' k, count(*) c from public.pens
                          group by 1) t),
    'flex',             (select jsonb_object_agg(k, c) from (
                          select nib->>'flex' k, count(*) c from public.pens
                          group by 1) t),
    'countryOfOrigin',  (select jsonb_object_agg(k, c) from (
                          select country_of_origin k, count(*) c from public.pens
                          group by 1) t),
    'priceTier',        (select jsonb_object_agg(k, c) from (
                          select pricing->>'priceTier' k, count(*) c from public.pens
                          group by 1) t)
  );
$$;
-- Call from the client:
-- const { data: facets } = await sb.rpc('pen_facets');
```

Symmetric `paper_facets()` for the paper chips. Re-run nightly via `pg_cron` and cache to a small `facets_cache` table if cold-start matters.

### 8.5 · The 5-axis Sommelier picker (Postgres function)

Match by Euclidean distance against `pairings.scoring`:

```sql
create or replace function public.find_pairings(
  wetness   int,
  tooth     int,
  sheen     int,
  heritage  int,
  occasion  int,
  result_limit int default 12
)
returns table (
  id text,
  archive_number int,
  pen_id text,
  paper_id text,
  affinity_score int,
  editorial jsonb,
  distance double precision
)
language sql stable as $$
  select id, archive_number, pen_id, paper_id, affinity_score, editorial,
    sqrt(
      power((scoring->>'wetnessAbsorbency')::int - wetness, 2) +
      power((scoring->>'nibSizeTooth')::int      - tooth,    2) +
      power((scoring->>'sheenSmoothness')::int   - sheen,    2) +
      power((scoring->>'flexSizing')::int        - heritage, 2) +
      power((scoring->>'useMood')::int           - occasion, 2)
    ) as distance
  from public.pairings
  order by distance asc
  limit result_limit;
$$;

-- Call from the client:
-- const { data } = await sb.rpc('find_pairings',
--   { wetness:72, tooth:22, sheen:82, heritage:34, occasion:60, result_limit:12 });
```

### 8.6 · Realtime, Storage, Edge functions

- **Storage:** Put all pen/paper/writing-sample PNGs in a single `media` bucket, public-read. Folder structure: `pens/:id/hero.png`, `papers/:id/hero.png`, `pairings/:id/sample.png`. The `photos.*` fields on each row store **paths** (not full URLs); the client wraps `sb.storage.from('media').getPublicUrl(path)`.
- **Realtime:** The picker may benefit from a Realtime channel on `pairings` so editor updates appear without reload. Otherwise, none required.
- **Edge functions:** None needed unless you want a single rolled-up `getAlmanacPayload()` for SSR.

### 8.7 · Migrations

Use Supabase CLI migrations (`supabase/migrations/`) to track schema. Seed data lives in `supabase/seed.sql`. Don't seed from JSON in JS — Postgres can ingest the same schema via `\copy` or generated `insert into … values …` from a TypeScript build script.

---

## 9 · File map

| File | Purpose | Notes for Claude Code |
|---|---|---|
| `index.html` | The almanac — single-page composition | Server-side render or hydrate sections by id. Search anchors: `#archive-pens`, `#archive-papers`, `#pairings`, `#picker`, `#compare`. |
| `pen.html` | Single-pen detail | Replace hard-coded Custom 823 data with `Pen` payload. Route: `/pens/:id`. |
| `paper.html` | Single-paper detail | Replace hard-coded Tomoe River data with `Paper` payload. Route: `/papers/:id`. |
| `styles.css` | Global tokens + components | Tokens are CSS custom properties; the Tweaks panel writes to them. Don't compile/rename. |
| `tweaks.jsx` | Design controls | Browser-only. Strip from production build if not needed. |
| `tweaks-panel.jsx` | Panel framework | Same. |
| `image-slot.js` | User-fillable image targets | Replace with regular `<img>` tags pointing at CDN URLs once you have real photography. The slot's `id` attributes map to photo slots (e.g. `hero-pen` → `pen.photos.hero`). |

---

## 10 · UI conventions to preserve

- **Hairline rule** = `1px solid var(--hairline)`. Never use a thicker default border.
- **Display type** wraps in `<span class="serif">` and uses `<em>` for editorial accents (rendered in oxblood italic).
- **Eyebrows / micro-labels** use `class="mono"` — 10–11 px IBM Plex Mono, tracked +12 to +16%, uppercased.
- **Spectrum bars** all share the same anatomy: `.scale-bar > i` with `left: NN%`. Map 0–100 scoring fields directly to the `left` percent.
- **Numerals** in display contexts should be tabular: use `font-variant-numeric: tabular-nums`.
- **Section numbering** is editorial: "№ 01 · Principles". Roman numerals for sub-items (i, ii, iii…).

### Accessibility floors

- Body type ≥ 13 px (15 px default). The mono labels at 9.5–10.5 px are for tiny utility text only.
- Hit targets ≥ 32 × 32 px.
- Colour contrast: AA on body, AAA on body where possible. `--ink` on `--paper` is ~16:1.
- Reduce motion: there are no animations to gate, but if you add them respect `prefers-reduced-motion`.

---

## 11 · Editorial tone

- *No marketing voice.* The almanac is written by editors who measure things.
- Sentences are short. Commas, em-dashes, semicolons.
- Use specific nouns ("the 14k medium nib", "52gsm cream") not adjectives ("amazing", "premium").
- "Pairing" / "Marriage" are interchangeable for variety. Avoid "combo".
- Lower-case roman numerals for editor's-list items. "i.", "ii.", "iii."
- Number formatting: spaces around units ("29 g", "149.5 mm"), no commas in metric ("1500 mm" not "1,500 mm"). Currency uses thin space: "$ 360".

---

## 12 · Open questions for the product owner

1. **Ink as first-class entity?** Right now ink is referenced in pairing conditions only. Promote to its own archive + pairing-with-ink dimension?
2. **User accounts?** Save favourites, build your own pairings, leave notes?
3. **Submissions?** Open the catalogue to community pairings with editorial review?
4. **Shop integration?** Direct links to retailers, or stay editorial?
5. **Multilingual?** The Cormorant/Plex Mono pair handles JA, but the body copy will need translation.
6. **Print issue?** The colophon promises a quarterly print almanac — is that real?

---

## 13 · Phase 2 — proposed additions

- **Ink archive** with the schema above.
- **Pairing-of-the-week** rotation, with a small CMS.
- **Daily affinity sample** — a single new pairing each day, RSS + email.
- **"Find my flight"** — extend the picker to assemble a 3-pen / 3-paper tasting set.
- **Repair & restoration** department for vintage pens.
- **Reader letters** — back to the editorial paper-letter origin.
