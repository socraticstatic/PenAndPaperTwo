-- P6 · Seed 7 more pens (full Pen schema per design CLAUDE.md §4).
--
-- Objective specs (dimensions, weight, nib material, filling system)
-- verified against manufacturer pages and reviewers — see commit message
-- and PROGRESS.md for the source list. Subjective fields (smoothness,
-- wetnessScore, mood, bestUses, tags) are editorial calls in the
-- prototype's wine-catalogue register.
--
-- Idempotent: rerun safely; ON CONFLICT (id) DO NOTHING leaves existing
-- rows untouched. Use Supabase Studio to edit values once seeded.

insert into public.pens (
  id, archive_number, brand, model, variant,
  year_introduced, country_of_origin, city_of_origin, in_production,
  nib, ink_delivery, body, dimensions, ergonomics,
  performance, heritage, service, pricing, editorial, photos
) values
-- ── Pelikan Souverän M800 ─────────────────────────────────────────
(
  'pelikan-souveran-m800', 11, 'Pelikan', 'Souverän M800', 'Black/Green Stripe',
  1987, 'Germany', 'Hannover', true,
  jsonb_build_object('size','M','sizeNormalized','M','nibWidthMm',0.6,'material','Gold 18k','tipping','Iridium','flex','Semi-flex','shape','Round','sizeDesignation',800,'hasBreatherHole',true,'twoTone',true,'engraving','Pelikan · 18C-750 · Germany'),
  jsonb_build_object('fillingSystem','Piston','cartridgeStandard','None (piston only)','inkCapacityMl',1.35,'shutOffValve',false,'feedMaterial','Ebonite (in some runs)','flow','Wet','flowScore',78,'hardStarting',2,'skipping',1,'dryOutDays',4),
  jsonb_build_object('material','Cellulose acetate','finish','Polished','colour','Black/Green stripe','translucency','Opaque','trim','Gold-plated 24k','trimColor','Gold','clipType','Pelikan beak','capType','Screw-on','capTurns',1.25),
  jsonb_build_object('lengthCappedMm',140,'lengthUncappedMm',127,'lengthPostedMm',165,'gripDiameterMm',12,'maxDiameterMm',15,'weightCappedG',29,'weightUncappedG',18,'weightCapG',11,'weightPostedG',29),
  jsonb_build_object('postability','Postable, but most prefer unposted','balance','Excellent balance unposted; cap weight pushes back if posted','gripComfort',9,'capRetention','Secure (1.25 cap turns)'),
  jsonb_build_object('smoothness',8,'wetnessScore',78,'lineVariation','Moderate to springy','feedback','Light, controlled','hardStarting',2,'skipping',1,'dryOutDays',4,'bestUses',jsonb_build_array('Daybook','Correspondence','Long-form'),'mood',jsonb_build_array('Heritage','Considered'),'avoidFor',jsonb_build_array('Quick notes on coated paper')),
  jsonb_build_object('designer','Pelikan in-house','family','Pelikan Souverän line','predecessor','Pelikan 800 (1950s)','yearOfRelease',1987,'manufacturer','Pelikan','countryOfAssembly','Germany','continuousProduction',true,'nicknames',jsonb_build_array('M800','Souverän 800')),
  jsonb_build_object('warranty','Pelikan international warranty','repairability','High — fully serviceable in Hannover and at most pen specialists','cleaningDifficulty','Low — piston disassembly is straightforward','partsAvailability','Excellent','recommendedFlush','Every 6 weeks'),
  jsonb_build_object('priceTier','IV','msrpUsd',540,'streetUsd',420,'currency','USD'),
  jsonb_build_object('deck','Three decades of cellulose-acetate stripes, a Pelikan beak clip, and an 18k nib that sings — the German archetype.','tastingNote','The springy 18k nib finds its line on textured paper, sheens politely on smoother sheets, and posts only if you want the weight against your wrist. A piston filler that has earned its longevity.','editorPick',true,'editorName','The Editors','tags',jsonb_build_array('piston','heritage','18k','German classic')),
  jsonb_build_object('silhouetteId','classic-cigar','silhouetteColor','#1a2b1a')
)
-- The full 7-row seed lives in the apply_migration call recorded in
-- the git history; here we keep just the first canonical example as a
-- template. Re-running this exact file is non-destructive (ON CONFLICT).
on conflict (id) do nothing;
