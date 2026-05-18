import type { PaperRow } from "@/lib/supabase/papers";
import type {
  Editorial,
  PaperAppearance,
  PaperFormat,
  PaperPerformance,
  PaperSubstance,
  PaperSurface,
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

export function PaperAttributeCards({ paper }: { paper: PaperRow }) {
  const substance = (paper.substance ?? {}) as PaperSubstance;
  const surface = (paper.surface ?? {}) as PaperSurface;
  const performance = (paper.performance ?? {}) as PaperPerformance;
  const appearance = (paper.appearance ?? {}) as PaperAppearance;
  const format = (paper.format ?? {}) as PaperFormat;
  const editorial = (paper.editorial ?? {}) as Editorial;
  const pricing = (paper.pricing ?? {}) as Pricing;
  const heritage = (paper.heritage ?? {}) as Record<string, unknown>;
  const texture = (paper.texture ?? {}) as Record<string, unknown>;

  const dry = performance.dryTimeByNib ?? {};

  return (
    <div className="attr-groups">
      <AttrCard
        numeral="i."
        titleStart="Identity "
        titleAccent="&"
        titleEnd=" Provenance"
        lede="Where this sheet comes from and how it sits in the archive."
        lines={[
          { label: "Brand", value: paper.brand },
          { label: "Model", value: paper.model },
          { label: "Variant", value: paper.variant },
          { label: "Mill", value: paper.mill },
          { label: "Country", value: paper.country_of_origin },
          { label: "Year introduced", value: paper.year_introduced },
          {
            label: "Archive number",
            value: `№ ${String(paper.archive_number).padStart(3, "0")}`,
          },
          { label: "Succeeds", value: paper.successor_of },
          {
            label: "Status",
            value: paper.in_production ? "In production" : "Discontinued",
          },
        ]}
      />

      <AttrCard
        numeral="ii."
        titleStart="Substance "
        titleAccent="&"
        titleEnd=" Composition"
        klass="tall"
        lede="What the sheet is made of, and how dense it is."
        lines={[
          {
            label: "Weight",
            value: substance.gsm ? `${substance.gsm} gsm` : null,
          },
          {
            label: "Caliper",
            value:
              (substance as { caliperUm?: number }).caliperUm
                ? `${(substance as { caliperUm?: number }).caliperUm} µm`
                : null,
          },
          {
            label: "Opacity",
            value:
              (substance as { opacity?: number }).opacity != null
                ? `${(substance as { opacity?: number }).opacity}%`
                : null,
          },
          { label: "Pulp source", value: substance.pulpSource },
          {
            label: "Cotton",
            value:
              (substance as { cottonPct?: number }).cottonPct != null
                ? `${(substance as { cottonPct?: number }).cottonPct}%`
                : null,
            zeroOk: true,
          },
          {
            label: "Recycled",
            value:
              (substance as { recycledPct?: number }).recycledPct != null
                ? `${(substance as { recycledPct?: number }).recycledPct}%`
                : null,
            zeroOk: true,
          },
          {
            label: "Acid-free",
            value: fmtBool((substance as { acidFree?: boolean }).acidFree),
          },
          {
            label: "Archival",
            value: fmtBool((substance as { archival?: boolean }).archival),
          },
          {
            label: "pH level",
            value: (substance as { phLevel?: number }).phLevel,
          },
          { label: "Lignin", value: (substance as { lignin?: string }).lignin },
          {
            label: "Brightness (CIE)",
            value: (substance as { brightnessCIE?: number }).brightnessCIE,
          },
        ]}
      />

      <AttrCard
        numeral="iii."
        titleStart="Surface "
        titleAccent="&"
        titleEnd=" Finish"
        lede="How the sheet meets the nib."
        lines={[
          { label: "Tooth", value: surface.tooth },
          {
            label: "Tooth score",
            value:
              (surface as { toothScore?: number }).toothScore != null
                ? `${(surface as { toothScore?: number }).toothScore} / 5`
                : null,
          },
          { label: "Finish", value: (surface as { finish?: string }).finish },
          { label: "Sizing", value: surface.sizing },
          { label: "Coating", value: surface.coating },
          {
            label: "Hygroscopy",
            value: (surface as { hygroscopy?: string }).hygroscopy,
          },
          {
            label: "Grain direction",
            value: (surface as { grainDirection?: string }).grainDirection,
          },
        ]}
      />

      <AttrCard
        numeral="iv."
        titleStart="Behaviour "
        titleAccent="with"
        titleEnd=" Ink"
        lede="How the page responds to a wet line."
        lines={[
          {
            label: "Feathering",
            value:
              performance.featheringTendency != null
                ? `${performance.featheringTendency} / 5`
                : null,
          },
          {
            label: "Bleed-through",
            value:
              performance.bleedThroughTendency != null
                ? `${performance.bleedThroughTendency} / 5`
                : null,
          },
          {
            label: "Show-through",
            value:
              performance.showThroughTendency != null
                ? `${performance.showThroughTendency} / 5`
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
            label: "Shading",
            value:
              performance.shadingVisibility != null
                ? `${performance.shadingVisibility} / 5`
                : null,
          },
          {
            label: "Shimmer",
            value:
              performance.shimmerVisibility != null
                ? `${performance.shimmerVisibility} / 5`
                : null,
          },
          { label: "Best for flow", value: fmtList(performance.bestForFlow) },
          {
            label: "Best for nib size",
            value: fmtList(performance.bestForNibSize),
          },
          {
            label: "Double-sided?",
            value: fmtBool(performance.doubleSided),
          },
        ]}
      />

      <AttrCard
        numeral="v."
        titleStart="Dry Time "
        titleAccent="·"
        titleEnd=" by Nib"
        lede="Seconds to dry, by nib width, on this sheet."
        lines={[
          { label: "EF", value: dry.EF ? `${dry.EF} s` : null },
          { label: "F", value: dry.F ? `${dry.F} s` : null },
          { label: "M", value: dry.M ? `${dry.M} s` : null },
          { label: "B", value: dry.B ? `${dry.B} s` : null },
          { label: "BB", value: dry.BB ? `${dry.BB} s` : null },
        ]}
      />

      <AttrCard
        numeral="vi."
        titleStart="Watermark "
        titleAccent="&"
        titleEnd=" Texture"
        lede="What the sheet shows when held to light."
        lines={[
          { label: "Laid lines", value: texture.laidLines as string | undefined },
          { label: "Watermark", value: texture.watermark as string | undefined },
          {
            label: "Translucency",
            value: texture.translucency as string | undefined,
          },
          {
            label: "Felt side",
            value: texture.feltSide as string | undefined,
          },
          {
            label: "Surface note",
            value: (surface as { surfaceNote?: string }).surfaceNote,
          },
        ]}
      />

      <AttrCard
        numeral="vii."
        titleStart="Mill "
        titleAccent="&"
        titleEnd=" Heritage"
        lede="The house that makes the sheet."
        lines={[
          {
            label: "Original maker",
            value: heritage.originalMaker as string | undefined,
          },
          {
            label: "Company established",
            value: heritage.companyEstablished as number | undefined,
          },
          {
            label: "Current maker",
            value: heritage.currentMaker as string | undefined,
          },
          {
            label: "Transition year",
            value: heritage.transitionYear as number | undefined,
          },
          {
            label: "Predecessor",
            value: heritage.predecessor as string | undefined,
          },
          { label: "Mill location", value: heritage.mill as string | undefined },
          {
            label: "Heritage note",
            value: heritage.heritageNote as string | undefined,
          },
          {
            label: "Tier",
            value: pricing.priceTier ? `Tier ${pricing.priceTier}` : null,
          },
          {
            label: "Price label",
            value: (pricing as { fromPriceLabel?: string }).fromPriceLabel,
          },
        ]}
      />

      <AttrCard
        numeral="viii."
        titleStart="Format, Binding "
        titleAccent="&"
        titleEnd=" Sizes"
        lede="How the sheet is sold and on what scaffolding."
        lines={[
          { label: "Kind", value: format.kind },
          { label: "Sizes available", value: fmtList(format.sizesAvailable) },
          { label: "Rulings", value: fmtList(format.rulingsAvailable) },
          {
            label: "Sheets per pad",
            value: (format as { sheetsPerPad?: number }).sheetsPerPad,
          },
          {
            label: "Sheets per notebook",
            value: (format as { sheetsPerNotebook?: number }).sheetsPerNotebook,
          },
          {
            label: "Tone",
            value: appearance.tone,
          },
          {
            label: "Warmth",
            value: appearance.warmth,
          },
          {
            label: "Colour hex",
            value: appearance.colorHex,
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
