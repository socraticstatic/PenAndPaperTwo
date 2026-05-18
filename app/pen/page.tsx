import parse, {
  type DOMNode,
  type HTMLReactParserOptions,
  Element,
} from "html-react-parser";
import type { Metadata } from "next";
import { loadPrototypePage } from "@/lib/prototype";
import { InlineScripts } from "@/components/InlineScripts";
import {
  fetchPenById,
  type PenBody,
  type PenDimensions,
  type PenEditorial,
  type PenInkDelivery,
  type PenNib,
  type PenPricing,
  type PenRow,
} from "@/lib/supabase/pens";

// P2 hard-codes which pen lives at /pen. In a later phase /pens/[id] takes
// the id from the URL; for now we pick the seeded record.
const PEN_ID = "pilot-custom-823";

export async function generateMetadata(): Promise<Metadata> {
  const pen = await fetchPenById(PEN_ID);
  if (!pen) return { title: "Pen — Pen & Paper" };
  return {
    title: `${pen.brand} ${pen.model} — Pen & Paper`,
  };
}

// Splits "Amber Demonstrator" into ["Amber", "Demonstrator"]. The prototype
// renders the variant on two lines with the first word italicised; we keep
// that shape.
function splitVariant(variant: string | null): { italic: string; rest: string } {
  if (!variant) return { italic: "", rest: "" };
  const parts = variant.split(/\s+/);
  return { italic: parts[0] ?? "", rest: parts.slice(1).join(" ") };
}

function formatArchive(n: number): string {
  return `№ ${String(n).padStart(3, "0")}`;
}

function buildReplace(pen: PenRow): HTMLReactParserOptions["replace"] {
  const nib = (pen.nib ?? {}) as PenNib;
  const ink = (pen.ink_delivery ?? {}) as PenInkDelivery;
  const body = (pen.body ?? {}) as PenBody;
  const dims = (pen.dimensions ?? {}) as PenDimensions;
  const pricing = (pen.pricing ?? {}) as PenPricing;
  const editorial = (pen.editorial ?? {}) as PenEditorial;
  const variant = splitVariant(pen.variant);

  return (node: DOMNode) => {
    if (!(node instanceof Element)) return undefined;

    // ── Breadcrumb mid: `№ 003 — Custom 823`
    if (
      node.name === "span" &&
      node.attribs.class?.split(/\s+/).includes("crumb-mid")
    ) {
      return (
        <span className="crumb-mid">
          {formatArchive(pen.archive_number)} — {pen.model}
        </span>
      );
    }

    // ── H1 hero title: model on first line, variant words 2 + 3
    if (node.name === "h1") {
      return (
        <h1>
          {pen.model}
          <br />
          <em>{variant.italic}</em>
          <br />
          {variant.rest}
        </h1>
      );
    }

    // ── `<p class="deck">` — italic lede paragraph
    if (
      node.name === "p" &&
      node.attribs.class?.split(/\s+/).includes("deck")
    ) {
      return <p className="deck">{editorial.deck ?? ""}</p>;
    }

    // ── Eyebrow row (3 spans): archive · pen-of-the-archive · tier · price
    if (
      node.name === "div" &&
      node.attribs.class?.split(/\s+/).includes("pen-hero-eyebrow")
    ) {
      const price =
        pricing.msrpUsd != null ? `$ ${pricing.msrpUsd}` : "";
      return (
        <div className="pen-hero-eyebrow mono">
          <span>{formatArchive(pen.archive_number)} · Pen of the Archive</span>
          {pricing.priceTier ? <span>Tier {pricing.priceTier}</span> : null}
          {price ? <span>{price}</span> : null}
        </div>
      );
    }

    // ── Hero key-spec table (6 cards): Nib / Filler / Flow / Weight / Material / Length
    if (
      node.name === "div" &&
      node.attribs.class?.split(/\s+/).includes("keyspecs")
    ) {
      const specs: Array<{ k: string; v: string | null | undefined }> = [
        {
          k: "Nib",
          v:
            nib.material && nib.size
              ? `${nib.material.replace(/^Gold /, "")} · ${nib.size}`
              : null,
        },
        { k: "Filler", v: ink.fillingSystem?.replace(/\s*\(.*\)$/, "") },
        { k: "Flow", v: ink.flow },
        {
          k: "Weight",
          v: dims.weightCappedG ? `${dims.weightCappedG} g` : null,
        },
        { k: "Material", v: body.material },
        {
          k: "Length",
          v: dims.lengthCappedMm ? `${dims.lengthCappedMm} mm` : null,
        },
      ];
      return (
        <div className="keyspecs">
          {specs
            .filter((s) => s.v) // progressive disclosure: skip empties
            .map((s) => (
              <div className="keyspec" key={s.k}>
                <div className="k">{s.k}</div>
                <div className="v">{s.v}</div>
              </div>
            ))}
        </div>
      );
    }

    return undefined;
  };
}

export default async function PenPage() {
  const [pen, page] = await Promise.all([
    fetchPenById(PEN_ID),
    loadPrototypePage("pen.html"),
  ]);

  if (!pen) {
    // Surface the gap rather than silently falling back. This page only
    // exists in P2 for the seeded record; if it's missing, something
    // upstream is wrong.
    return (
      <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
        <h1>Pen not found</h1>
        <p>
          No row in <code>public.pens</code> with <code>id = {PEN_ID}</code>.
          Run the seed in <code>supabase/seeds/01_pilot_custom_823.sql</code>.
        </p>
      </main>
    );
  }

  return (
    <>
      {page.headStyles.map((css, i) => (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: css }}
          // eslint-disable-next-line react/no-array-index-key
          key={i}
        />
      ))}
      {parse(page.bodyHtml, { replace: buildReplace(pen) })}
      <InlineScripts scripts={page.inlineScripts} />
    </>
  );
}
