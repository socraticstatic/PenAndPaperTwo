-- P3 · D6 — Pairing №047 · Pilot Custom 823 × Tomoe River S
-- Values mirror `design-source/project/pairing.html`. Depends on
-- seeded pen (`pilot-custom-823`) and paper (`tomoe-river-s`).

insert into public.pairings (
  id, archive_number, pen_id, paper_id, affinity_score,
  use_case, mood, is_editors_choice, is_pairing_of_week,
  scoring, measurements, conditions, editorial
) values (
  'pairing-047',
  47,
  'pilot-custom-823',
  'tomoe-river-s',
  94,
  'Correspondence',
  array['Contemplative'],
  true,
  true,
  jsonb_build_object(
    'wetnessAbsorbency', 95,
    'nibSizeTooth',      92,
    'sheenSmoothness',   96,
    'flexSizing',        90,
    'useMood',           94,
    'overall',           94
  ),
  jsonb_build_object(
    'inkUsed',       'Iroshizuku Tsuki-yo',
    'dryTimeSec',    38,
    'bleed',         'None',
    'ghosting',      'Visible',
    'feathering',    'Nil',
    'showThrough',   'Moderate',
    'sheenObserved', 'Pronounced',
    'shading',       'Excellent',
    'lineCrispness', '9/10'
  ),
  jsonb_build_object(
    'hour',            '21:14',
    'lightingK',       2700,
    'tempC',           19,
    'rhPct',           48,
    'angleDeg',        30,
    'hand',            'Right · posted · 55°',
    'photographedAt',  '2026-04-26T21:14:00Z'
  ),
  jsonb_build_object(
    'deck',
      'A wet Japanese vacuum-filler meets the thinnest paper that still holds its line — reserved for letters intended to be kept.',
    'tastingNote',
      'In every quiet stroke a small choice — the nib accepts, the paper assents, and a sentence appears that did not exist a moment before this exact ink met this exact cream-fibred sheet, at this hour, in this light, by this hand.'
  )
) on conflict (id) do nothing;
