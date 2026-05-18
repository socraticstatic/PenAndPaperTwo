import type { PenRow } from "@/lib/supabase/pens";
import type {
  Editorial,
  PenBody,
  PenDimensions,
  PenErgonomics,
  PenInkDelivery,
  PenNib,
  PenPerformance,
  Pricing,
} from "@/lib/supabase/jsonb-shapes";

// One row in an attr-card. Empty values get filtered out by AttrCard.
type AttrLine = {
  label: string;
  value: string | number | null | undefined;
  // If true, treat 0 as a real value rather than empty
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

export function PenAttributeCards({ pen }: { pen: PenRow }) {
  const nib = (pen.nib ?? {}) as PenNib;
  const ink = (pen.ink_delivery ?? {}) as PenInkDelivery;
  const body = (pen.body ?? {}) as PenBody;
  const dims = (pen.dimensions ?? {}) as PenDimensions;
  const erg = (pen.ergonomics ?? {}) as PenErgonomics;
  const perf = (pen.performance ?? {}) as PenPerformance;
  const editorial = (pen.editorial ?? {}) as Editorial;
  const pricing = (pen.pricing ?? {}) as Pricing;

  // Some optional fields live as loose JSON; narrow inline.
  const heritage = (pen.heritage ?? {}) as Record<string, unknown>;
  const service = (pen.service ?? {}) as Record<string, unknown>;
  const edition = (pen.edition ?? {}) as Record<string, unknown>;

  return (
    <div className="attr-groups">
      <AttrCard
        numeral="i."
        titleStart="Identity "
        titleAccent="&"
        titleEnd=" Provenance"
        lede="Where the specimen was made, by whom, and which generation it belongs to."
        lines={[
          { label: "Maker", value: pen.brand },
          { label: "Model", value: pen.model },
          { label: "Variant", value: pen.variant },
          { label: "Year introduced", value: pen.year_introduced },
          { label: "Year discontinued", value: pen.year_discontinued },
          { label: "Generation", value: pen.generation },
          {
            label: "Edition",
            value:
              typeof edition.note === "string"
                ? (edition.note as string)
                : edition.isLimited
                  ? "Limited"
                  : "Regular production",
          },
          { label: "Country", value: pen.country_of_origin },
          { label: "City", value: pen.city_of_origin },
          {
            label: "Archive number",
            value: `№ ${String(pen.archive_number).padStart(3, "0")}`,
          },
          {
            label: "Status",
            value: pen.in_production ? "In production" : "Discontinued",
          },
        ]}
      />

      <AttrCard
        numeral="ii."
        titleStart="The "
        titleAccent="Nib"
        klass="tall"
        lede="The metal between the writer and the page — its size, shape, material, and how willingly it bends."
        lines={[
          { label: "Material", value: nib.material },
          { label: "Plating", value: (nib as { plating?: string }).plating },
          { label: "Tipping", value: nib.tipping },
          { label: "Size", value: nib.size },
          {
            label: "Tip width",
            value: nib.nibWidthMm ? `${nib.nibWidthMm} mm` : null,
          },
          { label: "Shape", value: nib.shape },
          {
            label: "Custom grind",
            value: (nib as { customGrind?: string }).customGrind,
          },
          { label: "Flex", value: nib.flex },
          {
            label: "Line variation",
            value: perf.lineVariation,
          },
          {
            label: "Breather hole",
            value: fmtBool(nib.hasBreatherHole),
          },
          { label: "Two-tone", value: fmtBool(nib.twoTone) },
          {
            label: "Engraving",
            value: (nib as { engraving?: string }).engraving,
          },
          {
            label: "Designation",
            value: nib.sizeDesignation
              ? `№ ${nib.sizeDesignation}`
              : null,
          },
        ]}
      />

      <AttrCard
        numeral="iii."
        titleStart="Ink "
        titleAccent="Delivery"
        lede="How the pen takes in ink, holds it, and lets it onto the page."
        lines={[
          { label: "Filling system", value: ink.fillingSystem },
          { label: "Cartridge standard", value: ink.cartridgeStandard },
          {
            label: "Capacity",
            value: ink.inkCapacityMl ? `${ink.inkCapacityMl} ml` : null,
          },
          { label: "Shut-off valve", value: fmtBool(ink.shutOffValve) },
          { label: "Feed material", value: ink.feedMaterial },
          { label: "Flow", value: ink.flow },
          {
            label: "Flow score",
            value: ink.flowScore != null ? `${ink.flowScore} / 100` : null,
          },
          {
            label: "Hard starts",
            value:
              (ink as { hardStarting?: number }).hardStarting != null
                ? `${(ink as { hardStarting?: number }).hardStarting} / 5`
                : null,
          },
          {
            label: "Skipping",
            value:
              (ink as { skipping?: number }).skipping != null
                ? `${(ink as { skipping?: number }).skipping} / 5`
                : null,
          },
          {
            label: "Dry-out",
            value:
              (ink as { dryOutDays?: number }).dryOutDays != null
                ? `${(ink as { dryOutDays?: number }).dryOutDays} days`
                : null,
          },
        ]}
      />

      <AttrCard
        numeral="iv."
        titleStart="Body "
        titleAccent="&"
        titleEnd=" Trim"
        lede="The hand holds this; the eye sees this."
        lines={[
          { label: "Material", value: body.material },
          { label: "Finish", value: (body as { finish?: string }).finish },
          { label: "Colour", value: (body as { colour?: string }).colour },
          { label: "Translucency", value: body.translucency },
          { label: "Trim", value: (body as { trim?: string }).trim },
          { label: "Trim colour", value: body.trimColor },
          { label: "Clip", value: body.clipType },
          { label: "Cap type", value: body.capType },
          {
            label: "Cap turns",
            value:
              (body as { capTurns?: number }).capTurns != null
                ? `${(body as { capTurns?: number }).capTurns} turns`
                : null,
          },
          { label: "Section", value: (body as { section?: string }).section },
          { label: "Threads", value: (body as { threads?: string }).threads },
        ]}
      />

      <AttrCard
        numeral="v."
        titleStart="Dimensions "
        titleAccent="&"
        titleEnd=" Weight"
        lede="Measured to the tenth of a millimetre."
        lines={[
          {
            label: "Length, capped",
            value: dims.lengthCappedMm ? `${dims.lengthCappedMm} mm` : null,
          },
          {
            label: "Length, uncapped",
            value: dims.lengthUncappedMm ? `${dims.lengthUncappedMm} mm` : null,
          },
          {
            label: "Length, posted",
            value: dims.lengthPostedMm ? `${dims.lengthPostedMm} mm` : null,
          },
          {
            label: "Grip diameter",
            value: dims.gripDiameterMm ? `${dims.gripDiameterMm} mm` : null,
          },
          {
            label: "Max diameter",
            value: dims.maxDiameterMm ? `${dims.maxDiameterMm} mm` : null,
          },
          {
            label: "Cap diameter",
            value: (dims as { capDiameterMm?: number }).capDiameterMm
              ? `${(dims as { capDiameterMm?: number }).capDiameterMm} mm`
              : null,
          },
          {
            label: "Weight, capped",
            value: dims.weightCappedG ? `${dims.weightCappedG} g` : null,
          },
          {
            label: "Weight, uncapped",
            value: (dims as { weightUncappedG?: number }).weightUncappedG
              ? `${(dims as { weightUncappedG?: number }).weightUncappedG} g`
              : null,
          },
          {
            label: "Weight, cap only",
            value: (dims as { weightCapG?: number }).weightCapG
              ? `${(dims as { weightCapG?: number }).weightCapG} g`
              : null,
          },
          {
            label: "Weight, posted",
            value: (dims as { weightPostedG?: number }).weightPostedG
              ? `${(dims as { weightPostedG?: number }).weightPostedG} g`
              : null,
          },
        ]}
      />

      <AttrCard
        numeral="vi."
        titleStart="Heritage "
        titleAccent="&"
        titleEnd=" Lineage"
        lede="Who designed it, who builds it, and what came before."
        lines={[
          { label: "Designer", value: heritage.designer as string | undefined },
          { label: "Family", value: heritage.family as string | undefined },
          {
            label: "Predecessor",
            value: heritage.predecessor as string | undefined,
          },
          {
            label: "Successor",
            value: heritage.successor as string | undefined,
          },
          {
            label: "Year of release",
            value: heritage.yearOfRelease as number | undefined,
          },
          {
            label: "Manufacturer",
            value: heritage.manufacturer as string | undefined,
          },
          {
            label: "Country of assembly",
            value: heritage.countryOfAssembly as string | undefined,
          },
          {
            label: "Continuous production",
            value: fmtBool(heritage.continuousProduction),
          },
          {
            label: "Cultural note",
            value: heritage.culturalNote as string | undefined,
          },
          {
            label: "Notable users",
            value: fmtList(heritage.notableUsers),
          },
        ]}
      />

      <AttrCard
        numeral="vii."
        titleStart="Service "
        titleAccent="&"
        titleEnd=" Care"
        lede="How long it lasts and what it asks for."
        lines={[
          { label: "Warranty", value: service.warranty as string | undefined },
          {
            label: "Repairability",
            value: service.repairability as string | undefined,
          },
          {
            label: "Cleaning difficulty",
            value: service.cleaningDifficulty as string | undefined,
          },
          {
            label: "Parts availability",
            value: service.partsAvailability as string | undefined,
          },
          {
            label: "Recommended flush",
            value: service.recommendedFlush as string | undefined,
          },
          {
            label: "Seal conditioning",
            value: service.sealConditioning as string | undefined,
          },
          {
            label: "MSRP",
            value: pricing.msrpUsd != null ? `$ ${pricing.msrpUsd}` : null,
          },
          {
            label: "Street price",
            value:
              (pricing as { streetUsd?: number }).streetUsd != null
                ? `$ ${(pricing as { streetUsd?: number }).streetUsd}`
                : null,
          },
          {
            label: "Tier",
            value: pricing.priceTier ? `Tier ${pricing.priceTier}` : null,
          },
        ]}
      />

      <AttrCard
        numeral="viii."
        titleStart="Ergonomics "
        titleAccent="&"
        titleEnd=" Character"
        klass="wide"
        lede="How it feels to hold, and what kind of writing it asks for."
        lines={[
          { label: "Postability", value: erg.postability },
          { label: "Balance", value: erg.balance },
          {
            label: "Grip comfort",
            value:
              (erg as { gripComfort?: number }).gripComfort != null
                ? `${(erg as { gripComfort?: number }).gripComfort} / 10`
                : null,
          },
          {
            label: "Cap retention",
            value: (erg as { capRetention?: string }).capRetention,
          },
          {
            label: "Smoothness",
            value:
              perf.smoothness != null ? `${perf.smoothness} / 10` : null,
          },
          {
            label: "Wetness",
            value:
              perf.wetnessScore != null
                ? `${perf.wetnessScore} / 100`
                : null,
          },
          {
            label: "Feedback",
            value: (perf as { feedback?: string }).feedback,
          },
          { label: "Best uses", value: fmtList(perf.bestUses) },
          { label: "Mood", value: fmtList(perf.mood) },
          {
            label: "Avoid for",
            value: fmtList((perf as { avoidFor?: string[] }).avoidFor),
          },
          {
            label: "Tags",
            value: fmtList(
              (editorial as { tags?: string[] }).tags as string[] | undefined,
            ),
          },
        ]}
      />
    </div>
  );
}
