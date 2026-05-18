import type { InkRow } from "@/lib/supabase/inks";
import type {
  Editorial,
  InkChemistry,
  InkColor,
  InkPairing,
  InkPerformance,
  Pricing,
} from "@/lib/supabase/jsonb-shapes";

type AttrLine = {
  label: string;
  value: string | number | null | undefined;
  zeroOk?: boolean;
};

function fmtList(arr: unknown): string | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr.join(", ");
}

function fmtBool(v: unknown, t = "Yes", f = "No"): string | null {
  if (v === true) return t;
  if (v === false) return f;
  return null;
}

function isPresent(v: AttrLine["value"], zeroOk: boolean | undefined): boolean {
  if (v === null || v === undefined) return false;
  if (v === "") return false;
  if (typeof v === "number" && v === 0 && !zeroOk) return false;
  return true;
}

function AttrCard({
  numeral,
  titleStart,
  titleAccent,
  titleEnd,
  lede,
  klass,
  lines,
}: {
  numeral: string;
  titleStart?: string;
  titleAccent: string;
  titleEnd?: string;
  lede?: string;
  klass?: "tall" | "wide";
  lines: AttrLine[];
}) {
  const visible = lines.filter((l) => isPresent(l.value, l.zeroOk));
  if (visible.length === 0) return null;
  return (
    <div className={klass ? `attr-group ${klass}` : "attr-group"}>
      <div className="attr-group-head">
        <span className="ttl">
          {titleStart}
          <em>{titleAccent}</em>
          {titleEnd}
        </span>
        <span className="num">{numeral}</span>
      </div>
      {lede ? <p className="attr-group-lede">{lede}</p> : null}
      <div className="attr-list">
        {visible.map((l) => (
          <div className="attr-line" key={l.label}>
            <span className="label">{l.label}</span>
            <span className="value">{String(l.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InkAttributeCards({ ink }: { ink: InkRow }) {
  const color = (ink.color ?? {}) as InkColor;
  const chemistry = (ink.chemistry ?? {}) as InkChemistry;
  const performance = (ink.performance ?? {}) as InkPerformance;
  const pairing = (ink.pairing ?? {}) as InkPairing;
  const editorial = (ink.editorial ?? {}) as Editorial;
  const pricing = (ink.pricing ?? {}) as Pricing;
  const dry = performance.dryTimeByNib ?? {};

  return (
    <div className="attr-groups">
      <AttrCard
        numeral="i."
        titleStart="Identity "
        titleAccent="&"
        titleEnd=" Provenance"
        lede="Where the ink comes from and what family it belongs to."
        lines={[
          { label: "Brand", value: ink.brand },
          { label: "Model", value: ink.model },
          { label: "English", value: ink.model_english },
          { label: "Variant", value: ink.variant },
          { label: "Line", value: ink.subfamily },
          { label: "Family", value: ink.family },
          { label: "Hue family", value: ink.hue_family },
          { label: "Warmth", value: ink.warmth },
          { label: "Country", value: ink.country_of_origin },
          { label: "Year introduced", value: ink.year_introduced },
          {
            label: "Archive number",
            value: `№ ${String(ink.archive_number).padStart(3, "0")}`,
          },
          {
            label: "Status",
            value: ink.in_production ? "In production" : "Discontinued",
          },
        ]}
      />

      <AttrCard
        numeral="ii."
        titleStart="Colour "
        titleAccent="&"
        titleEnd=" Hue"
        lede="The exact colour, light and dark, and how it shifts as the ink dries."
        lines={[
          { label: "Colour name", value: color.name },
          { label: "Primary hex", value: color.hex?.toUpperCase() },
          { label: "OKLCH", value: color.oklch },
          { label: "Shading (high)", value: color.shadingHigh?.toUpperCase() },
          { label: "Shading (low)", value: color.shadingLow?.toUpperCase() },
          { label: "Sheen hex", value: color.sheenHex?.toUpperCase() },
          {
            label: "Sheen angle",
            value: color.sheenAngleDeg ? `${color.sheenAngleDeg}°` : null,
          },
          {
            label: "Shimmer colour",
            value: (color as { shimmerColor?: string }).shimmerColor,
          },
          {
            label: "Shimmer size",
            value: (color as { shimmerSize?: string }).shimmerSize,
          },
          {
            label: "Wet→dry shift",
            value:
              color.wetDryShiftDelta != null
                ? `${color.wetDryShiftDelta} / 100`
                : null,
          },
        ]}
      />

      <AttrCard
        numeral="iii."
        titleAccent="Chemistry"
        lede="The composition behind the colour."
        lines={[
          { label: "pH", value: (chemistry as { ph?: number }).ph },
          {
            label: "Viscosity",
            value: (chemistry as { viscosityCp?: number }).viscosityCp
              ? `${(chemistry as { viscosityCp?: number }).viscosityCp} cP`
              : null,
          },
          {
            label: "Surface tension",
            value: (chemistry as { surfaceTensionMnm?: number }).surfaceTensionMnm
              ? `${(chemistry as { surfaceTensionMnm?: number }).surfaceTensionMnm} mN/m`
              : null,
          },
          {
            label: "Dye loading",
            value:
              chemistry.dyePct != null ? `~ ${chemistry.dyePct} %` : null,
          },
          {
            label: "Pigment loading",
            value:
              chemistry.pigmentPct != null
                ? `~ ${chemistry.pigmentPct} %`
                : null,
          },
          { label: "Water-resistant", value: chemistry.waterResistant },
          {
            label: "Permanent",
            value: fmtBool(chemistry.permanent),
          },
          { label: "Archival", value: fmtBool(chemistry.archival) },
          {
            label: "Bleach-resistant",
            value: fmtBool(
              (chemistry as { bleachResistant?: boolean }).bleachResistant,
            ),
          },
          { label: "Maintenance", value: chemistry.maintenanceDemand },
          {
            label: "Safe for demonstrator",
            value: fmtBool(chemistry.safeForDemonstrator),
          },
        ]}
      />

      <AttrCard
        numeral="iv."
        titleStart="Behaviour "
        titleAccent="on the"
        titleEnd=" Page"
        lede="How the ink dries, sheens, and behaves under everyday writing."
        lines={[
          {
            label: "Wetness",
            value:
              performance.wetness != null ? `${performance.wetness} / 100` : null,
          },
          {
            label: "Saturation",
            value:
              performance.saturation != null
                ? `${performance.saturation} / 100`
                : null,
          },
          {
            label: "Shading",
            value:
              performance.shadingVisibility != null
                ? `${performance.shadingVisibility} / 5`
                : null,
          },
          {
            label: "Sheen",
            value:
              performance.sheenVisibility != null
                ? `${performance.sheenVisibility} / 5`
                : null,
          },
          {
            label: "Shimmer",
            value:
              performance.shimmerVisibility != null
                ? `${performance.shimmerVisibility} / 5`
                : null,
          },
          {
            label: "Feathering",
            value:
              (performance as { feathering?: number }).feathering != null
                ? `${(performance as { feathering?: number }).feathering} / 5`
                : null,
          },
          {
            label: "Ghosting",
            value:
              (performance as { ghosting?: number }).ghosting != null
                ? `${(performance as { ghosting?: number }).ghosting} / 5`
                : null,
          },
          {
            label: "Bleed tendency",
            value:
              (performance as { bleedTendency?: number }).bleedTendency != null
                ? `${(performance as { bleedTendency?: number }).bleedTendency} / 5`
                : null,
          },
          {
            label: "Behaviour on cream",
            value: (performance as { behaviourOnCream?: string }).behaviourOnCream,
          },
          {
            label: "Behaviour on bright",
            value: (performance as { behaviourOnBright?: string }).behaviourOnBright,
          },
        ]}
      />

      <AttrCard
        numeral="v."
        titleStart="Dry Time "
        titleAccent="·"
        titleEnd=" by Nib"
        lede="Seconds to dry on standard test paper, by nib width."
        lines={[
          { label: "EF", value: dry.EF ? `${dry.EF} s` : null },
          { label: "F", value: dry.F ? `${dry.F} s` : null },
          { label: "M", value: dry.M ? `${dry.M} s` : null },
          { label: "B", value: dry.B ? `${dry.B} s` : null },
          { label: "BB", value: dry.BB ? `${dry.BB} s` : null },
          {
            label: "Base (M nib)",
            value: performance.dryTimeBaseSec
              ? `${performance.dryTimeBaseSec} s`
              : null,
          },
        ]}
      />

      <AttrCard
        numeral="vi."
        titleStart="Pairing "
        titleAccent="&"
        titleEnd=" Best Use"
        lede="What this ink is for, and what it wants beside it."
        lines={[
          { label: "Best for use", value: fmtList(pairing.bestForUse) },
          {
            label: "Best for mood",
            value: fmtList(pairing.bestForMood),
          },
          {
            label: "Tier",
            value: pricing.priceTier ? `Tier ${pricing.priceTier}` : null,
          },
          {
            label: "MSRP",
            value: pricing.msrpUsd != null ? `$ ${pricing.msrpUsd}` : null,
          },
          {
            label: "Bottle",
            value: (pricing as { bottleMl?: number }).bottleMl
              ? `${(pricing as { bottleMl?: number }).bottleMl} ml`
              : null,
          },
          {
            label: "Editor pick",
            value:
              typeof editorial.editorPick === "string"
                ? editorial.editorPick
                : fmtBool(editorial.editorPick),
          },
        ]}
      />
    </div>
  );
}
