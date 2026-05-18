-- P3 · papers table
-- Schema verbatim from design CLAUDE.md §8.1. RLS enabled in the same
-- migration for compactness; only a public-read policy in P3, writes
-- happen via Supabase Studio.

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
  texture              jsonb,
  heritage             jsonb,
  pricing              jsonb,
  editorial            jsonb not null,
  photos               jsonb not null,

  recommended_pen_ids  text[] default '{}',
  affinity_scores      jsonb  default '{}'::jsonb,

  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create index papers_gsm_idx         on public.papers (((substance->>'gsm')::int));
create index papers_tooth_idx       on public.papers ((surface->>'tooth'));
create index papers_tone_idx        on public.papers ((appearance->>'tone'));
create index papers_swatch_idx      on public.papers ((appearance->>'swatchClass'));
create index papers_format_kind_idx on public.papers ((format->>'kind'));

alter table public.papers enable row level security;

create policy "papers are publicly readable"
  on public.papers
  for select
  to anon, authenticated
  using (true);
