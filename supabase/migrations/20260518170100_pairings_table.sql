-- P3 · pairings table
-- Schema verbatim from design CLAUDE.md §8.1. pen_id / paper_id are FKs;
-- both pens and papers tables already exist. RLS public-read in same
-- migration for compactness.

create table public.pairings (
  id                   text primary key,
  archive_number       int  not null unique,
  pen_id               text not null references public.pens(id)   on delete cascade,
  paper_id             text not null references public.papers(id) on delete cascade,
  affinity_score       int  not null check (affinity_score between 0 and 100),
  use_case             text not null,
  mood                 text[] not null default '{}',
  is_editors_choice    boolean not null default false,
  is_pairing_of_week   boolean not null default false,

  scoring              jsonb not null,
  measurements         jsonb not null,
  conditions           jsonb not null,
  editorial            jsonb not null,
  writing_sample_photo text,

  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create unique index pairings_pen_paper on public.pairings (pen_id, paper_id);
create index pairings_affinity         on public.pairings (affinity_score desc);
create index pairings_usecase          on public.pairings (use_case);
create index pairings_pofw             on public.pairings (is_pairing_of_week) where is_pairing_of_week = true;

alter table public.pairings enable row level security;

create policy "pairings are publicly readable"
  on public.pairings
  for select
  to anon, authenticated
  using (true);
