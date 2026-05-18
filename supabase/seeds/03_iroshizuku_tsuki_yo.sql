-- P3 · D6 — Iroshizuku Tsuki-yo (Ink №014)
-- Values mirror `design-source/project/ink-detail.html`. MVR per §7
-- plus the optional fields the prototype hero actually displays.

insert into public.inks (
  id, archive_number, brand, model, model_english,
  country_of_origin, year_introduced, in_production,
  family, subfamily, hue_family, warmth,
  color, chemistry, performance, pairing, pricing, editorial, photos,
  recommended_pen_ids, recommended_paper_ids
) values (
  'iroshizuku-tsuki-yo',
  14,
  'Pilot · Iroshizuku',
  'Tsuki-yo',
  'Moonlit Night',
  'Japan',
  2007,
  true,
  'Dye',
  'Everyday',
  'Blue-black',
  'Cool',
  jsonb_build_object(
    'hex',           '#1c2c47',
    'name',          'Moonlit Night',
    'oklch',         'oklch(28% 0.07 255)',
    'shadingHigh',   '#2c4458',
    'shadingLow',    '#0e1a2b',
    'sheenHex',      '#9a5a3a',
    'sheenAngleDeg', 30,
    'wetDryShiftDelta', 18
  ),
  jsonb_build_object(
    'waterResistant',     'Some',
    'permanent',          false,
    'archival',           false,
    'bleachResistant',    false,
    'maintenanceDemand',  'Low',
    'safeForDemonstrator', true,
    'dyePct',             3.4
  ),
  jsonb_build_object(
    'wetness',           72,
    'saturation',        78,
    'shadingVisibility', 5,
    'sheenVisibility',   5,
    'shimmerVisibility', 1,
    'feathering',        1,
    'ghosting',          2,
    'bleedTendency',     1,
    'dryTimeBaseSec',    38,
    'dryTimeByNib',      jsonb_build_object('EF', 14, 'F', 22, 'M', 38, 'B', 62, 'BB', 90),
    'behaviourOnCream',  'Richer; sheens more.',
    'behaviourOnBright', 'Crisper; sheen muted.'
  ),
  jsonb_build_object(
    'bestForUse',  jsonb_build_array('Correspondence', 'Journaling', 'Letter-writing'),
    'bestForMood', jsonb_build_array('Contemplative')
  ),
  jsonb_build_object('priceTier', 'II', 'msrpUsd', 32, 'bottleMl', 50),
  jsonb_build_object(
    'deck',
      'The moon, viewed from a window, on a night cool enough to want the lamp on.',
    'tastingNote',
      'From the line of Iroshizuku — "colour droplets" — each ink named for a moment in the Japanese natural year. Tsuki-yo writes wet, dries slowly, and rewards a sheen-tolerant paper with copper at the troughs.'
  ),
  jsonb_build_object(
    'bottleShape', 'Iroshizuku flask',
    'glassNote',   'Glass · cork-stopper'
  ),
  array['pilot-custom-823'],
  array['tomoe-river-s']
) on conflict (id) do nothing;
