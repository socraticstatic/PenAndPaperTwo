// Narrow shapes for the JSONB columns Supabase types as opaque `Json`.
//
// The Postgres tables store rich nested objects; the auto-generated
// `database.types.ts` declares those columns as `Json` because Postgres
// doesn't tell Supabase what shape we packed in. These types narrow
// what the application code actually reads — they mirror the
// TypeScript schemas in design-source/project/CLAUDE.md §4 (pens),
// §5 (papers), §6 (pairings), §7 (inks).
//
// Only fields we currently render are listed. Add more as new bindings
// land. Every field is optional because of progressive disclosure: a
// row with only the Minimum Viable Record fields populated should
// type-check at every read site.

// ─── Shared across every entity ────────────────────────────────
export type Editorial = {
  deck?: string;
  tastingNote?: string;
  editorPick?: boolean | string;
  headline?: string;
};

export type Pricing = {
  priceTier?: string;
  msrpUsd?: number;
  bottleMl?: number;
  fromPriceLabel?: string;
};

// ─── Pen JSONB groupings ───────────────────────────────────────
export type PenNib = {
  size?: string;
  sizeNormalized?: string;
  nibWidthMm?: number;
  material?: string;
  tipping?: string;
  flex?: string;
  shape?: string;
  sizeDesignation?: number;
  hasBreatherHole?: boolean;
  twoTone?: boolean;
};

export type PenInkDelivery = {
  fillingSystem?: string;
  cartridgeStandard?: string;
  inkCapacityMl?: number;
  shutOffValve?: boolean;
  feedMaterial?: string;
  flow?: string;
  flowScore?: number;
};

export type PenBody = {
  material?: string;
  translucency?: string;
  trimColor?: string;
  clipType?: string;
  capType?: string;
};

export type PenDimensions = {
  lengthCappedMm?: number;
  lengthUncappedMm?: number;
  lengthPostedMm?: number;
  gripDiameterMm?: number;
  maxDiameterMm?: number;
  weightCappedG?: number;
  weightUncappedG?: number;
};

export type PenErgonomics = {
  postability?: string;
  balance?: string;
};

export type PenPerformance = {
  smoothness?: number;
  wetnessScore?: number;
  lineVariation?: string;
  hardStarting?: number;
  skipping?: number;
  dryOutDays?: number;
  bestUses?: string[];
  mood?: string[];
};

// ─── Paper JSONB groupings ─────────────────────────────────────
export type PaperSubstance = {
  gsm?: number;
  caliperUm?: number;
  opacity?: number;
  pulpSource?: string;
  cottonPct?: number;
  recycledPct?: number;
  acidFree?: boolean;
  archival?: boolean;
  phLevel?: number;
  lignin?: string;
  brightnessCIE?: number;
};

export type PaperSurface = {
  tooth?: string;
  toothScore?: number;
  finish?: string;
  sizing?: string;
  coating?: string;
  hygroscopy?: string;
  grainDirection?: string;
};

export type PaperPerformance = {
  featheringTendency?: number;
  bleedThroughTendency?: number;
  showThroughTendency?: number;
  sheenVisibility?: number;
  shadingVisibility?: number;
  shimmerVisibility?: number;
  bestForFlow?: string[];
  bestForNibSize?: string[];
  doubleSided?: boolean;
  dryTimeByNib?: Record<string, number | undefined>;
};

export type PaperAppearance = {
  tone?: string;
  warmth?: string;
  colorHex?: string;
  swatchClass?: string;
};

export type PaperFormat = {
  kind?: string;
  sizesAvailable?: string[];
  rulingsAvailable?: string[];
};

// ─── Ink JSONB groupings ───────────────────────────────────────
export type InkColor = {
  hex?: string;
  name?: string;
  oklch?: string;
  shadingHigh?: string;
  shadingLow?: string;
  sheenHex?: string;
  sheenAngleDeg?: number;
  shimmerColor?: string;
  shimmerSize?: string;
  wetDryShiftDelta?: number;
};

export type InkChemistry = {
  ph?: number;
  viscosityCp?: number;
  surfaceTensionMnm?: number;
  dyePct?: number;
  pigmentPct?: number;
  waterResistant?: string;
  permanent?: boolean;
  archival?: boolean;
  bleachResistant?: boolean;
  maintenanceDemand?: string;
  safeForDemonstrator?: boolean;
};

export type InkPerformance = {
  wetness?: number;
  saturation?: number;
  shadingVisibility?: number;
  sheenVisibility?: number;
  shimmerVisibility?: number;
  feathering?: number;
  ghosting?: number;
  bleedTendency?: number;
  dryTimeBaseSec?: number;
  dryTimeByNib?: Record<string, number | undefined>;
  behaviourOnCream?: string;
  behaviourOnBright?: string;
};

export type InkPairing = {
  bestForUse?: string[];
  bestForMood?: string[];
};

// ─── Pairing JSONB groupings ───────────────────────────────────
export type PairingScoring = {
  wetnessAbsorbency?: number;
  nibSizeTooth?: number;
  sheenSmoothness?: number;
  flexSizing?: number;
  useMood?: number;
  overall?: number;
};

export type PairingMeasurements = {
  inkUsed?: string;
  dryTimeSec?: number;
  bleed?: string;
  ghosting?: string;
  feathering?: string;
  showThrough?: string;
  sheenObserved?: string;
  shading?: string;
  lineCrispness?: string;
};

export type PairingConditions = {
  hour?: string;
  lightingK?: number;
  tempC?: number;
  rhPct?: number;
  angleDeg?: number;
  hand?: string;
  photographedAt?: string;
};
