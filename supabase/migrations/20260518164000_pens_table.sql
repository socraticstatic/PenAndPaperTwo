-- P2 · D2 — pens table
-- Schema verbatim from design-source/project/CLAUDE.md §8.1.
-- JSONB columns mirror the TypeScript Pen schema in §4; only Minimum Viable
-- Record fields are required at the DDL level (nib, ink_delivery, body,
-- dimensions, performance, pricing, editorial, photos). Optional groupings
-- (ergonomics, heritage, service, edition) are nullable so progressive
-- disclosure works — a row with only the MVR set renders cleanly.
--
-- RLS is enabled in the next migration. This one is schema only.

create table public.pens (
  id                    text primary key,                 -- slug, e.g. "pilot-custom-823"
  archive_number        int  not null unique,
  brand                 text not null,
  model                 text not null,
  variant               text,
  year_introduced       int  not null,
  year_discontinued     int,
  generation            text,
  country_of_origin     text not null,
  city_of_origin        text,
  edition               jsonb,
  in_production         boolean not null default true,

  nib                   jsonb not null,                   -- Pen['nib']
  ink_delivery          jsonb not null,                   -- Pen['inkDelivery']
  body                  jsonb not null,                   -- Pen['body']
  dimensions            jsonb not null,                   -- Pen['dimensions']
  ergonomics            jsonb,
  performance           jsonb not null,                   -- Pen['performance']
  heritage              jsonb,                            -- Pen['heritage']
  service               jsonb,                            -- Pen['service']
  pricing               jsonb not null,
  editorial             jsonb not null,
  photos                jsonb not null,                   -- { hero, uncapped, ... }

  recommended_paper_ids text[] default '{}',
  affinity_scores       jsonb default '{}'::jsonb,        -- { paper_id: 0–100 }

  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Facet indexes the /pens archive will hit. Each maps to a JSONB key the UI
-- exposes as a filter chip. Kept verbatim from design CLAUDE.md §8.1 so the
-- query planner uses them once we wire the archive route.
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
