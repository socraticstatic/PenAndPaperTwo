-- P2 · D6 — seed: Pilot Custom 823 (Amber Demonstrator)
--
-- Values mirror what `design-source/project/pen.html` currently renders
-- as hard-coded sample data, so the live /pen route looks identical
-- before and after the swap to DB-driven rendering. Idempotent: rerun
-- safely; existing rows are left alone (use Supabase Studio to edit).
--
-- Only Minimum Viable Record fields (per design CLAUDE.md §4) plus the
-- handful of optional fields the prototype actually displays.

insert into public.pens (
  id, archive_number, brand, model, variant,
  year_introduced, country_of_origin, city_of_origin, in_production,
  nib, ink_delivery, body, dimensions, ergonomics,
  performance, pricing, editorial, photos
) values (
  'pilot-custom-823',
  3,
  'Pilot',
  'Custom 823',
  'Amber Demonstrator',
  1992,
  'Japan',
  'Hiratsuka',
  true,
  jsonb_build_object(
    'size',            'M',
    'sizeNormalized',  'M',
    'nibWidthMm',      0.55,
    'material',        'Gold 14k',
    'tipping',         'Iridium alloy',
    'flex',            'Soft',
    'shape',           'Round',
    'sizeDesignation', 5,
    'hasBreatherHole', true,
    'twoTone',         false
  ),
  jsonb_build_object(
    'fillingSystem',     'Vacuum (vac-fill)',
    'cartridgeStandard', 'Proprietary',
    'inkCapacityMl',     2.0,
    'shutOffValve',      true,
    'feedMaterial',      'Plastic',
    'flow',              'Wet',
    'flowScore',         82
  ),
  jsonb_build_object(
    'material',     'Amber resin',
    'translucency', 'Demonstrator',
    'trimColor',    'Gold',
    'clipType',     'Spring clip',
    'capType',      'Screw-on'
  ),
  jsonb_build_object(
    'lengthCappedMm',    149.5,
    'lengthUncappedMm',  128.0,
    'lengthPostedMm',    155.0,
    'weightCappedG',     29,
    'weightUncappedG',   20
  ),
  jsonb_build_object(
    'postability', 'Postable'
  ),
  jsonb_build_object(
    'smoothness',    9,
    'wetnessScore',  82,
    'lineVariation', 'Moderate',
    'hardStarting',  1,
    'skipping',      1,
    'dryOutDays',    5,
    'bestUses',      jsonb_build_array('Correspondence', 'Journaling'),
    'mood',          jsonb_build_array('Contemplative')
  ),
  jsonb_build_object(
    'priceTier', 'III',
    'msrpUsd',   360
  ),
  jsonb_build_object(
    'deck',
      'A workhorse dressed as an heirloom — vacuum-filled, generously inked, and quietly engineered for the page.',
    'tastingNote',
      'Ink lays down wet and steady, then settles to a clean line as the paper accepts it. The vacuum filler is the obvious headline; the quiet competence of the nib is the actual story.',
    'editorPick', true
  ),
  -- No real photo yet; falling back to a silhouette + a swatch colour so the
  -- archive grid can render this row without a hero image. The /pen detail
  -- route keeps the prototype's <image-slot> placeholder for now (D5 wires
  -- real Storage assets).
  jsonb_build_object(
    'silhouetteId',    'classic-cigar',
    'silhouetteColor', '#c08a5b'
  )
) on conflict (id) do nothing;
