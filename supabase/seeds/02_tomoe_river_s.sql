-- P3 · D6 — Tomoe River S (Paper №001)
-- Values mirror `design-source/project/paper.html`. MVR per §5 + the
-- handful of optional fields the prototype hero actually displays.

insert into public.papers (
  id, archive_number, brand, model, mill,
  country_of_origin, year_introduced, in_production,
  substance, surface, performance, appearance, format,
  texture, heritage, pricing, editorial, photos
) values (
  'tomoe-river-s',
  1,
  'Tomoegawa',
  'Tomoe River S',
  'Tomoegawa Co. Ltd',
  'Japan',
  2019,
  true,
  jsonb_build_object(
    'gsm',          52,
    'caliperUm',    45,
    'opacity',      78,
    'pulpSource',   'Cellulose (wood)',
    'cottonPct',    0,
    'recycledPct',  0,
    'acidFree',     true,
    'archival',     true,
    'phLevel',      7.4,
    'lignin',       'Low',
    'brightnessCIE', 92
  ),
  jsonb_build_object(
    'tooth',       'Smooth',
    'toothScore',  2,
    'finish',      'Wove',
    'sizing',      'Internal · surface-sized',
    'coating',     'Uncoated · sized',
    'hygroscopy',  'Moderate',
    'grainDirection', 'Long-grain'
  ),
  jsonb_build_object(
    'featheringTendency',    1,
    'bleedThroughTendency',  1,
    'showThroughTendency',   4,
    'sheenVisibility',       5,
    'shadingVisibility',     5,
    'shimmerVisibility',     4,
    'bestForFlow',           jsonb_build_array('Wet', 'Saturated'),
    'bestForNibSize',        jsonb_build_array('F', 'M', 'B'),
    'doubleSided',           false,
    'dryTimeByNib',          jsonb_build_object('M', 38)
  ),
  jsonb_build_object(
    'tone',        'Cream',
    'warmth',      'Warm',
    'colorHex',    '#f1ead0',
    'swatchClass', 'cream'
  ),
  jsonb_build_object(
    'kind',              'Loose sheets',
    'sizesAvailable',    jsonb_build_array('A4', 'A5'),
    'rulingsAvailable',  jsonb_build_array('Blank', 'Lined', 'Dot')
  ),
  jsonb_build_object(
    'laidLines',  'Not visible — wove sheet',
    'watermark',  null
  ),
  jsonb_build_object(
    'originalMaker',  'Tomoegawa Co. Ltd',
    'companyEstablished', 1914,
    'predecessor',    'Tomoe River (original, 2019†)'
  ),
  jsonb_build_object('priceTier', 'II'),
  jsonb_build_object(
    'deck',
      'The thinnest sheet that still holds its line — reserved for letters intended to be kept.',
    'tastingNote',
      'Ink lays down wet and the page accepts it almost immediately; the sheen rises at the troughs as the colour dries to a long-held shade.'
  ),
  jsonb_build_object(
    'swatchClass', 'cream',
    'colorHex',    '#f1ead0'
  )
) on conflict (id) do nothing;
