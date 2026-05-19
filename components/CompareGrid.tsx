"use client";

import { useEffect, useState } from "react";
import { useCompareItems, type CompareItem } from "@/lib/client/compare";

// Side-by-side attribute grid. Shows every attribute the detail pages
// render — grouped (Identity, Nib, Ink Delivery, …) to match what
// /pens/[id], /papers/[id], /inks/[id] surface. Progressive disclosure:
// a row is hidden when every entity in compare is null on that field.
//
// Source of truth for row sets: this file. Mirrors the structure in
// lib/entities/{pen,paper,ink}-attribute-cards.tsx — if you add a
// field to a detail page card, mirror it here.

type EntityRow = Record<string, unknown> & {
  id: string;
  brand: string;
  model: string;
  variant?: string | null;
  archive_number: number;
  country_of_origin: string;
  year_introduced?: number | null;
};

type FetchedItem = CompareItem & { row: EntityRow | null };

type Group = {
  title: string;
  rows: RowSpec[];
};

type RowSpec = {
  label: string;
  get: (row: EntityRow | null) => Display;
};

type Display = string | number | null;

const TABLE_BY_KIND: Record<CompareItem["kind"], string> = {
  pen: "pens",
  paper: "papers",
  ink: "inks",
};

async function fetchOne(item: CompareItem): Promise<FetchedItem> {
  const cfg = (
    window as unknown as { ppSupabaseConfig?: { url?: string; anonKey?: string } }
  ).ppSupabaseConfig;
  if (!cfg?.url || !cfg?.anonKey) return { ...item, row: null };
  const table = TABLE_BY_KIND[item.kind];
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/${table}?id=eq.${encodeURIComponent(item.id)}&select=*`,
      {
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) return { ...item, row: null };
    const json = (await res.json()) as EntityRow[];
    return { ...item, row: json[0] ?? null };
  } catch {
    return { ...item, row: null };
  }
}

// ─── helpers for value extraction ──────────────────────────────────────
function path(row: EntityRow | null, ...keys: string[]): unknown {
  let cur: unknown = row;
  for (const k of keys) {
    if (cur == null) return null;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}
function str(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.length ? v : null;
  return String(v);
}
function num(v: unknown, suffix = ""): string | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return `${n}${suffix}`;
}
function bool(v: unknown, yes = "Yes", no = "No"): string | null {
  if (v === true) return yes;
  if (v === false) return no;
  return null;
}
function list(v: unknown): string | null {
  if (!Array.isArray(v) || v.length === 0) return null;
  return v.join(", ");
}

// ─── ROW SETS — match detail-page attribute cards ──────────────────────

const PEN_GROUPS: Group[] = [
  {
    title: "Identity & Provenance",
    rows: [
      { label: "Brand",              get: (r) => str(path(r, "brand")) },
      { label: "Model",              get: (r) => str(path(r, "model")) },
      { label: "Variant",            get: (r) => str(path(r, "variant")) },
      { label: "Year introduced",    get: (r) => num(path(r, "year_introduced")) },
      { label: "Year discontinued",  get: (r) => num(path(r, "year_discontinued")) },
      { label: "Generation",         get: (r) => str(path(r, "generation")) },
      { label: "Country",            get: (r) => str(path(r, "country_of_origin")) },
      { label: "City",               get: (r) => str(path(r, "city_of_origin")) },
      { label: "Archive number",     get: (r) => num(path(r, "archive_number"), "") },
      { label: "Status",             get: (r) => path(r, "in_production") === false ? "Discontinued" : "In production" },
    ],
  },
  {
    title: "The Nib",
    rows: [
      { label: "Material",           get: (r) => str(path(r, "nib", "material")) },
      { label: "Plating",            get: (r) => str(path(r, "nib", "plating")) },
      { label: "Tipping",            get: (r) => str(path(r, "nib", "tipping")) },
      { label: "Size",               get: (r) => str(path(r, "nib", "size")) },
      { label: "Size (normalised)", get: (r) => str(path(r, "nib", "sizeNormalized")) },
      { label: "Tip width",          get: (r) => num(path(r, "nib", "nibWidthMm"), " mm") },
      { label: "Shape",              get: (r) => str(path(r, "nib", "shape")) },
      { label: "Flex",               get: (r) => str(path(r, "nib", "flex")) },
      { label: "Breather hole",      get: (r) => bool(path(r, "nib", "hasBreatherHole")) },
      { label: "Two-tone",           get: (r) => bool(path(r, "nib", "twoTone")) },
      { label: "Designation №",      get: (r) => num(path(r, "nib", "sizeDesignation")) },
    ],
  },
  {
    title: "Ink Delivery",
    rows: [
      { label: "Filling system",     get: (r) => str(path(r, "ink_delivery", "fillingSystem")) },
      { label: "Cartridge standard", get: (r) => str(path(r, "ink_delivery", "cartridgeStandard")) },
      { label: "Capacity",           get: (r) => num(path(r, "ink_delivery", "inkCapacityMl"), " ml") },
      { label: "Shut-off valve",     get: (r) => bool(path(r, "ink_delivery", "shutOffValve")) },
      { label: "Feed material",      get: (r) => str(path(r, "ink_delivery", "feedMaterial")) },
      { label: "Flow",               get: (r) => str(path(r, "ink_delivery", "flow")) },
      { label: "Flow score",         get: (r) => num(path(r, "ink_delivery", "flowScore"), " / 100") },
    ],
  },
  {
    title: "Body & Trim",
    rows: [
      { label: "Material",           get: (r) => str(path(r, "body", "material")) },
      { label: "Finish",             get: (r) => str(path(r, "body", "finish")) },
      { label: "Colour",             get: (r) => str(path(r, "body", "colour")) },
      { label: "Translucency",       get: (r) => str(path(r, "body", "translucency")) },
      { label: "Trim",               get: (r) => str(path(r, "body", "trim")) },
      { label: "Trim colour",        get: (r) => str(path(r, "body", "trimColor")) },
      { label: "Clip",               get: (r) => str(path(r, "body", "clipType")) },
      { label: "Cap type",           get: (r) => str(path(r, "body", "capType")) },
      { label: "Cap turns",          get: (r) => num(path(r, "body", "capTurns"), " turns") },
      { label: "Section",            get: (r) => str(path(r, "body", "section")) },
      { label: "Threads",            get: (r) => str(path(r, "body", "threads")) },
    ],
  },
  {
    title: "Dimensions & Weight",
    rows: [
      { label: "Length, capped",     get: (r) => num(path(r, "dimensions", "lengthCappedMm"), " mm") },
      { label: "Length, uncapped",   get: (r) => num(path(r, "dimensions", "lengthUncappedMm"), " mm") },
      { label: "Length, posted",     get: (r) => num(path(r, "dimensions", "lengthPostedMm"), " mm") },
      { label: "Grip diameter",      get: (r) => num(path(r, "dimensions", "gripDiameterMm"), " mm") },
      { label: "Max diameter",       get: (r) => num(path(r, "dimensions", "maxDiameterMm"), " mm") },
      { label: "Weight, capped",     get: (r) => num(path(r, "dimensions", "weightCappedG"), " g") },
      { label: "Weight, uncapped",   get: (r) => num(path(r, "dimensions", "weightUncappedG"), " g") },
      { label: "Weight, posted",     get: (r) => num(path(r, "dimensions", "weightPostedG"), " g") },
    ],
  },
  {
    title: "Performance & Character",
    rows: [
      { label: "Smoothness",         get: (r) => num(path(r, "performance", "smoothness"), " / 10") },
      { label: "Wetness",            get: (r) => num(path(r, "performance", "wetnessScore"), " / 100") },
      { label: "Line variation",     get: (r) => str(path(r, "performance", "lineVariation")) },
      { label: "Hard-starting",      get: (r) => num(path(r, "performance", "hardStarting"), " / 5") },
      { label: "Skipping",           get: (r) => num(path(r, "performance", "skipping"), " / 5") },
      { label: "Dry-out",            get: (r) => num(path(r, "performance", "dryOutDays"), " days") },
      { label: "Best uses",          get: (r) => list(path(r, "performance", "bestUses")) },
      { label: "Mood",               get: (r) => list(path(r, "performance", "mood")) },
      { label: "Postability",        get: (r) => str(path(r, "ergonomics", "postability")) },
      { label: "Balance",            get: (r) => str(path(r, "ergonomics", "balance")) },
    ],
  },
  {
    title: "Heritage & Service",
    rows: [
      { label: "Designer",           get: (r) => str(path(r, "heritage", "designer")) },
      { label: "Family",             get: (r) => str(path(r, "heritage", "family")) },
      { label: "Predecessor",        get: (r) => str(path(r, "heritage", "predecessor")) },
      { label: "Manufacturer",       get: (r) => str(path(r, "heritage", "manufacturer")) },
      { label: "Country of assembly",get: (r) => str(path(r, "heritage", "countryOfAssembly")) },
      { label: "Warranty",           get: (r) => str(path(r, "service", "warranty")) },
      { label: "Repairability",      get: (r) => str(path(r, "service", "repairability")) },
      { label: "Parts availability", get: (r) => str(path(r, "service", "partsAvailability")) },
    ],
  },
  {
    title: "Pricing",
    rows: [
      { label: "MSRP (USD)",         get: (r) => num(path(r, "pricing", "msrpUsd"), "") },
      { label: "Tier",               get: (r) => {
        const t = path(r, "pricing", "priceTier");
        return t ? `Tier ${t}` : null;
      } },
    ],
  },
];

const PAPER_GROUPS: Group[] = [
  {
    title: "Identity & Provenance",
    rows: [
      { label: "Brand",              get: (r) => str(path(r, "brand")) },
      { label: "Model",              get: (r) => str(path(r, "model")) },
      { label: "Variant",            get: (r) => str(path(r, "variant")) },
      { label: "Mill",               get: (r) => str(path(r, "mill")) },
      { label: "Country",            get: (r) => str(path(r, "country_of_origin")) },
      { label: "Year introduced",    get: (r) => num(path(r, "year_introduced")) },
      { label: "Archive number",     get: (r) => num(path(r, "archive_number")) },
      { label: "Status",             get: (r) => path(r, "in_production") === false ? "Discontinued" : "In production" },
    ],
  },
  {
    title: "Substance & Composition",
    rows: [
      { label: "Weight",             get: (r) => num(path(r, "substance", "gsm"), " gsm") },
      { label: "Caliper",            get: (r) => num(path(r, "substance", "caliperUm"), " µm") },
      { label: "Opacity",            get: (r) => num(path(r, "substance", "opacity"), "%") },
      { label: "Pulp source",        get: (r) => str(path(r, "substance", "pulpSource")) },
      { label: "Cotton",             get: (r) => num(path(r, "substance", "cottonPct"), "%") },
      { label: "Recycled",           get: (r) => num(path(r, "substance", "recycledPct"), "%") },
      { label: "Acid-free",          get: (r) => bool(path(r, "substance", "acidFree")) },
      { label: "Archival",           get: (r) => bool(path(r, "substance", "archival")) },
      { label: "pH level",           get: (r) => num(path(r, "substance", "phLevel")) },
      { label: "Brightness (CIE)",   get: (r) => num(path(r, "substance", "brightnessCIE")) },
    ],
  },
  {
    title: "Surface & Finish",
    rows: [
      { label: "Tooth",              get: (r) => str(path(r, "surface", "tooth")) },
      { label: "Tooth score",        get: (r) => num(path(r, "surface", "toothScore"), " / 5") },
      { label: "Finish",             get: (r) => str(path(r, "surface", "finish")) },
      { label: "Sizing",             get: (r) => str(path(r, "surface", "sizing")) },
      { label: "Coating",            get: (r) => str(path(r, "surface", "coating")) },
      { label: "Hygroscopy",         get: (r) => str(path(r, "surface", "hygroscopy")) },
      { label: "Grain direction",    get: (r) => str(path(r, "surface", "grainDirection")) },
    ],
  },
  {
    title: "Behaviour with Ink",
    rows: [
      { label: "Feathering",         get: (r) => num(path(r, "performance", "featheringTendency"), " / 5") },
      { label: "Bleed-through",      get: (r) => num(path(r, "performance", "bleedThroughTendency"), " / 5") },
      { label: "Show-through",       get: (r) => num(path(r, "performance", "showThroughTendency"), " / 5") },
      { label: "Sheen visibility",   get: (r) => num(path(r, "performance", "sheenVisibility"), " / 5") },
      { label: "Shading visibility", get: (r) => num(path(r, "performance", "shadingVisibility"), " / 5") },
      { label: "Shimmer visibility", get: (r) => num(path(r, "performance", "shimmerVisibility"), " / 5") },
      { label: "Best for flow",      get: (r) => list(path(r, "performance", "bestForFlow")) },
      { label: "Best for nib size",  get: (r) => list(path(r, "performance", "bestForNibSize")) },
      { label: "Double-sided?",      get: (r) => bool(path(r, "performance", "doubleSided")) },
    ],
  },
  {
    title: "Dry Time by Nib",
    rows: [
      { label: "EF",                 get: (r) => num(path(r, "performance", "dryTimeByNib", "EF"), " s") },
      { label: "F",                  get: (r) => num(path(r, "performance", "dryTimeByNib", "F"), " s") },
      { label: "M",                  get: (r) => num(path(r, "performance", "dryTimeByNib", "M"), " s") },
      { label: "B",                  get: (r) => num(path(r, "performance", "dryTimeByNib", "B"), " s") },
      { label: "BB",                 get: (r) => num(path(r, "performance", "dryTimeByNib", "BB"), " s") },
    ],
  },
  {
    title: "Appearance",
    rows: [
      { label: "Tone",               get: (r) => str(path(r, "appearance", "tone")) },
      { label: "Warmth",             get: (r) => str(path(r, "appearance", "warmth")) },
      { label: "Colour hex",         get: (r) => str(path(r, "appearance", "colorHex")) },
    ],
  },
  {
    title: "Format",
    rows: [
      { label: "Kind",               get: (r) => str(path(r, "format", "kind")) },
      { label: "Sizes available",    get: (r) => list(path(r, "format", "sizesAvailable")) },
      { label: "Rulings",            get: (r) => list(path(r, "format", "rulingsAvailable")) },
    ],
  },
  {
    title: "Pricing",
    rows: [
      { label: "Tier",               get: (r) => {
        const t = path(r, "pricing", "priceTier");
        return t ? `Tier ${t}` : null;
      } },
    ],
  },
];

const INK_GROUPS: Group[] = [
  {
    title: "Identity & Provenance",
    rows: [
      { label: "Brand",              get: (r) => str(path(r, "brand")) },
      { label: "Model",              get: (r) => str(path(r, "model")) },
      { label: "English",            get: (r) => str(path(r, "model_english")) },
      { label: "Variant",            get: (r) => str(path(r, "variant")) },
      { label: "Family",             get: (r) => str(path(r, "family")) },
      { label: "Subfamily",          get: (r) => str(path(r, "subfamily")) },
      { label: "Hue family",         get: (r) => str(path(r, "hue_family")) },
      { label: "Warmth",             get: (r) => str(path(r, "warmth")) },
      { label: "Country",            get: (r) => str(path(r, "country_of_origin")) },
      { label: "Year introduced",    get: (r) => num(path(r, "year_introduced")) },
      { label: "Archive number",     get: (r) => num(path(r, "archive_number")) },
      { label: "Status",             get: (r) => path(r, "in_production") === false ? "Discontinued" : "In production" },
    ],
  },
  {
    title: "Colour & Hue",
    rows: [
      { label: "Colour name",        get: (r) => str(path(r, "color", "name")) },
      { label: "Primary hex",        get: (r) => str(path(r, "color", "hex")) },
      { label: "OKLCH",              get: (r) => str(path(r, "color", "oklch")) },
      { label: "Shading high",       get: (r) => str(path(r, "color", "shadingHigh")) },
      { label: "Shading low",        get: (r) => str(path(r, "color", "shadingLow")) },
      { label: "Sheen hex",          get: (r) => str(path(r, "color", "sheenHex")) },
      { label: "Sheen angle",        get: (r) => num(path(r, "color", "sheenAngleDeg"), "°") },
      { label: "Shimmer colour",     get: (r) => str(path(r, "color", "shimmerColor")) },
      { label: "Shimmer size",       get: (r) => str(path(r, "color", "shimmerSize")) },
      { label: "Wet→dry shift",      get: (r) => num(path(r, "color", "wetDryShiftDelta"), " / 100") },
    ],
  },
  {
    title: "Chemistry",
    rows: [
      { label: "pH",                 get: (r) => num(path(r, "chemistry", "ph")) },
      { label: "Viscosity",          get: (r) => num(path(r, "chemistry", "viscosityCp"), " cP") },
      { label: "Dye loading",        get: (r) => num(path(r, "chemistry", "dyePct"), " %") },
      { label: "Pigment loading",    get: (r) => num(path(r, "chemistry", "pigmentPct"), " %") },
      { label: "Water-resistant",    get: (r) => str(path(r, "chemistry", "waterResistant")) },
      { label: "Permanent",          get: (r) => bool(path(r, "chemistry", "permanent")) },
      { label: "Archival",           get: (r) => bool(path(r, "chemistry", "archival")) },
      { label: "Bleach-resistant",   get: (r) => bool(path(r, "chemistry", "bleachResistant")) },
      { label: "Maintenance",        get: (r) => str(path(r, "chemistry", "maintenanceDemand")) },
      { label: "Safe for demonstrator", get: (r) => bool(path(r, "chemistry", "safeForDemonstrator")) },
    ],
  },
  {
    title: "Behaviour on the Page",
    rows: [
      { label: "Wetness",            get: (r) => num(path(r, "performance", "wetness"), " / 100") },
      { label: "Saturation",         get: (r) => num(path(r, "performance", "saturation"), " / 100") },
      { label: "Shading",            get: (r) => num(path(r, "performance", "shadingVisibility"), " / 5") },
      { label: "Sheen",              get: (r) => num(path(r, "performance", "sheenVisibility"), " / 5") },
      { label: "Shimmer",            get: (r) => num(path(r, "performance", "shimmerVisibility"), " / 5") },
      { label: "Feathering",         get: (r) => num(path(r, "performance", "feathering"), " / 5") },
      { label: "Ghosting",           get: (r) => num(path(r, "performance", "ghosting"), " / 5") },
      { label: "Bleed tendency",     get: (r) => num(path(r, "performance", "bleedTendency"), " / 5") },
    ],
  },
  {
    title: "Dry Time by Nib",
    rows: [
      { label: "EF",                 get: (r) => num(path(r, "performance", "dryTimeByNib", "EF"), " s") },
      { label: "F",                  get: (r) => num(path(r, "performance", "dryTimeByNib", "F"), " s") },
      { label: "M",                  get: (r) => num(path(r, "performance", "dryTimeByNib", "M"), " s") },
      { label: "B",                  get: (r) => num(path(r, "performance", "dryTimeByNib", "B"), " s") },
      { label: "BB",                 get: (r) => num(path(r, "performance", "dryTimeByNib", "BB"), " s") },
      { label: "Base (M nib)",       get: (r) => num(path(r, "performance", "dryTimeBaseSec"), " s") },
    ],
  },
  {
    title: "Pairing & Best Use",
    rows: [
      { label: "Best for use",       get: (r) => list(path(r, "pairing", "bestForUse")) },
      { label: "Best for mood",      get: (r) => list(path(r, "pairing", "bestForMood")) },
    ],
  },
  {
    title: "Pricing",
    rows: [
      { label: "Tier",               get: (r) => {
        const t = path(r, "pricing", "priceTier");
        return t ? `Tier ${t}` : null;
      } },
      { label: "MSRP (USD)",         get: (r) => num(path(r, "pricing", "msrpUsd"), "") },
      { label: "Bottle",             get: (r) => num(path(r, "pricing", "bottleMl"), " ml") },
    ],
  },
];

const IDENTITY_FALLBACK: Group[] = [
  {
    title: "Identity",
    rows: [
      { label: "Brand",       get: (r) => str(path(r, "brand")) },
      { label: "Model",       get: (r) => str(path(r, "model")) },
      { label: "Country",     get: (r) => str(path(r, "country_of_origin")) },
      { label: "Year",        get: (r) => num(path(r, "year_introduced")) },
      { label: "Archive №",   get: (r) => num(path(r, "archive_number")) },
    ],
  },
];

function allValuesAgree(values: Display[]): boolean {
  const populated = values.filter((v) => v != null && v !== "");
  if (populated.length < 2) return false;
  const first = String(populated[0]);
  return populated.every((v) => String(v) === first);
}

function anyValuePopulated(values: Display[]): boolean {
  return values.some((v) => v != null && v !== "");
}

export function CompareGrid() {
  const items = useCompareItems();
  const [fetched, setFetched] = useState<FetchedItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out = await Promise.all(items.map(fetchOne));
      if (!cancelled) setFetched(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (!items.length) {
    return (
      <div className="compare-grid">
        <div
          className="cmp-row"
          style={{
            gridTemplateColumns: "1fr",
            padding: 32,
            color: "oklch(40% 0.02 80 / 0.65)",
            fontFamily: "var(--font-display, serif)",
            fontStyle: "italic",
          }}
        >
          The compare drawer is empty. Add specimens from any pen, paper, or ink page.
        </div>
      </div>
    );
  }

  const allSameKind = items.every((it) => it.kind === items[0].kind);
  const groups: Group[] = allSameKind
    ? items[0].kind === "pen"
      ? PEN_GROUPS
      : items[0].kind === "paper"
        ? PAPER_GROUPS
        : INK_GROUPS
    : IDENTITY_FALLBACK;

  const gridTemplateColumns = `220px repeat(${items.length}, 1fr)`;

  return (
    <div className="compare-grid" style={{ gridTemplateColumns }}>
      {/* Header row */}
      <div className="cmp-row" style={{ gridTemplateColumns }}>
        <div className="cmp-cell label" style={{ background: "var(--paper)" }}>
          <span className="mono">Specimen</span>
        </div>
        {fetched.map((it) => (
          <div
            className="cmp-cell header"
            key={`hd-${it.id}`}
            style={{ color: it.silhouetteColor ?? "oklch(28% 0.04 80)" }}
          >
            <span
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "oklch(40% 0.02 80 / 0.55)",
              }}
            >
              {it.kind.toUpperCase()}
            </span>
            <span className="cbrand">
              {it.row?.brand ?? it.brand}
              {it.row?.country_of_origin ? ` · ${it.row.country_of_origin}` : ""}
            </span>
            <span className="cname">{it.row?.model ?? it.model}</span>
          </div>
        ))}
      </div>

      {/* Grouped attribute rows */}
      {groups.map((group) => {
        const visibleRows = group.rows.filter((row) =>
          anyValuePopulated(fetched.map((it) => row.get(it.row))),
        );
        if (visibleRows.length === 0) return null;
        return (
          <div key={group.title} style={{ display: "contents" }}>
            <div
              className="cmp-row"
              style={{
                gridTemplateColumns,
                background: "oklch(94% 0.012 82)",
              }}
            >
              <div
                className="cmp-cell label"
                style={{
                  gridColumn: `span ${items.length + 1}`,
                  fontFamily: "var(--font-display, serif)",
                  fontSize: 16,
                  fontStyle: "italic",
                  color: "oklch(35% 0.13 25)",
                  padding: "16px 12px 8px",
                  borderTop: "0.5px solid oklch(40% 0.02 80 / 0.2)",
                }}
              >
                {group.title}
              </div>
            </div>
            {visibleRows.map((row) => {
              const values = fetched.map((it) => row.get(it.row));
              const match = allValuesAgree(values);
              return (
                <div
                  className={match ? "cmp-row match" : "cmp-row"}
                  style={{ gridTemplateColumns }}
                  key={`${group.title}-${row.label}`}
                >
                  <div className="cmp-cell label first">{row.label}</div>
                  {values.map((v, i) => (
                    <div className="cmp-cell" key={`${group.title}-${row.label}-${i}`}>
                      <span className="cmp-value">
                        {v != null && v !== "" ? String(v) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
