-- P6 · Expand Pilot Custom 823 to the full Pen schema (design CLAUDE.md §4).
-- Objective specs verified against gouletpens.com, gentlemanstationer.com,
-- penaddict.com, nibsmith.com — see /supabase/seeds/RESEARCH.md (TODO).
-- Subjective fields (smoothness, balance, mood) are editorial calls.

update public.pens set
  generation = '20th-anniversary edition (2012 onward; Amber relaunched 2014)',
  edition = jsonb_build_object(
    'isLimited', false,
    'note', 'Continuous production since 1992; Amber Demonstrator re-released 2014.'
  ),
  nib = jsonb_build_object(
    'size',            'M',
    'sizeNormalized',  'M',
    'nibWidthMm',      0.55,
    'material',        'Gold 14k',
    'plating',         null,
    'tipping',         'Iridium alloy',
    'flex',            'Soft',
    'shape',           'Round',
    'sizeDesignation', 15,
    'hasBreatherHole', true,
    'twoTone',         false,
    'engraving',       'PILOT · 14k · 585',
    'customGrind',     null
  ),
  ink_delivery = jsonb_build_object(
    'fillingSystem',     'Vacuum (vac-fill)',
    'cartridgeStandard', 'Proprietary',
    'inkCapacityMl',     2.2,
    'shutOffValve',      true,
    'feedMaterial',      'Plastic (ebonite-like resin)',
    'flow',              'Wet',
    'flowScore',         82,
    'hardStarting',      1,
    'skipping',          1,
    'dryOutDays',        7
  ),
  body = jsonb_build_object(
    'material',     'Amber resin',
    'finish',       'Polished demonstrator',
    'colour',       'Amber (translucent)',
    'translucency', 'Demonstrator',
    'trim',         'Gold-plated',
    'trimColor',    'Gold',
    'clipType',     'Spring clip',
    'capType',      'Screw-on',
    'capTurns',     1.5,
    'section',      'Tapered, gold-plated trim ring',
    'threads',      'Plastic, double-start'
  ),
  dimensions = jsonb_build_object(
    'lengthCappedMm',   150.0,
    'lengthUncappedMm', 130.0,
    'lengthPostedMm',   165.0,
    'gripDiameterMm',   10.5,
    'maxDiameterMm',    14.5,
    'capDiameterMm',    16.5,
    'weightCappedG',    29,
    'weightUncappedG',  20,
    'weightCapG',       9,
    'weightPostedG',    29
  ),
  ergonomics = jsonb_build_object(
    'postability',  'Postable',
    'balance',      'Slightly back-weighted when posted; well-balanced unposted',
    'gripComfort',  9,
    'capRetention', 'Secure (vacuum seal at end of cap travel)'
  ),
  performance = jsonb_build_object(
    'smoothness',    9,
    'wetnessScore',  82,
    'lineVariation', 'Moderate',
    'feedback',      'Pencil-on-glass',
    'hardStarting',  1,
    'skipping',      1,
    'dryOutDays',    7,
    'bestUses',      jsonb_build_array('Correspondence', 'Journaling', 'Long-form'),
    'mood',          jsonb_build_array('Contemplative', 'Considered'),
    'avoidFor',      jsonb_build_array('Fast-dry on coated paper', 'Carbon-copy work')
  ),
  heritage = jsonb_build_object(
    'designer',         'Pilot R&D (anonymous)',
    'family',           'Pilot Custom series',
    'predecessor',      'Pilot Custom 743',
    'successor',        null,
    'yearOfRelease',    1998,
    'firstAmberYear',   2014,
    'manufacturer',     'Pilot Corporation',
    'countryOfAssembly','Japan (Hiratsuka, Kanagawa)',
    'continuousProduction', true,
    'notableUsers',     jsonb_build_array('Famously associated with long-form writers')
  ),
  service = jsonb_build_object(
    'warranty',           'Pilot Corporation warranty (region-dependent)',
    'repairability',      'High — Pilot Corporation services the vacuum mechanism',
    'cleaningDifficulty', 'Moderate — vacuum-fill requires soaking the section',
    'partsAvailability',  'Available via Pilot service centres',
    'recommendedFlush',   'Every 6–8 weeks if used daily',
    'sealConditioning',   'Silicon grease the piston seal annually'
  ),
  pricing = jsonb_build_object(
    'priceTier',  'III',
    'msrpUsd',    360,
    'streetUsd',  240,
    'currency',   'USD',
    'firstYearPrice', null
  ),
  editorial = jsonb_build_object(
    'deck',
      'A workhorse dressed as an heirloom — vacuum-filled, generously inked, and quietly engineered for the page.',
    'tastingNote',
      'Ink lays down wet and steady, then settles to a clean line as the paper accepts it. The vacuum filler is the obvious headline; the quiet competence of the nib is the actual story. Best used in a single long session: the 2 ml capacity rewards patience.',
    'editorPick', true,
    'editorName', 'The Editors',
    'tags',       jsonb_build_array('vacuum-filler', 'demonstrator', 'workhorse', 'Japanese', 'editorial favourite')
  ),
  photos = jsonb_build_object(
    'silhouetteId',    'classic-cigar',
    'silhouetteColor', '#c08a5b',
    'hero',            null,
    'uncapped',        null,
    'inHand',          null,
    'nibDetail',       null
  ),
  recommended_paper_ids = array['tomoe-river-s']
where id = 'pilot-custom-823';
