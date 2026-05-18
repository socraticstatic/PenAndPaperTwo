-- P3 · inks table
--
-- Design CLAUDE.md §8.1 ships a thin "(Phase 2)" inks DDL with only
-- `family`, `color`, `properties`, `recommended_paper_ids`. That doesn't
-- cover the 6-card detail page (`ink-detail.html`). Extended here to
-- match §7's TypeScript schema: identity + family/hue/warmth + JSONB
-- groupings (color, chemistry, performance, pairing, editorial, photos).
-- Same shape as pens/papers so the three remain comparable.

create table public.inks (
  id                    text primary key,
  archive_number        int not null unique,
  brand                 text not null,
  model                 text not null,
  model_english         text,
  variant               text,
  country_of_origin     text not null,
  year_introduced       int,
  in_production         boolean not null default true,

  -- Family + tonal axis surfaced as columns so they index cleanly for
  -- the Ink Cupboard's chip filters.
  family                text not null,
  subfamily             text,
  hue_family            text not null,
  warmth                text not null,

  color                 jsonb not null,
  chemistry             jsonb,
  performance           jsonb not null,
  pairing               jsonb,
  pricing               jsonb,
  editorial             jsonb not null,
  photos                jsonb not null,

  recommended_pen_ids   text[] default '{}',
  recommended_paper_ids text[] default '{}',
  affinity_scores       jsonb default '{}'::jsonb,

  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index inks_hue_idx        on public.inks (hue_family);
create index inks_family_idx     on public.inks (family);
create index inks_warmth_idx     on public.inks (warmth);
create index inks_archive_idx    on public.inks (archive_number);
create index inks_dry_time_idx
  on public.inks (((performance->>'dryTimeBaseSec')::int));

alter table public.inks enable row level security;

create policy "inks are publicly readable"
  on public.inks
  for select
  to anon, authenticated
  using (true);
