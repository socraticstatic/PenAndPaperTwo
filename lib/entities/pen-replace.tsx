import Link from "next/link";
import {
  type DOMNode,
  type HTMLReactParserOptions,
  Element,
} from "html-react-parser";
import type { PenRow } from "@/lib/supabase/pens";
import type {
  Editorial,
  PenBody,
  PenDimensions,
  PenInkDelivery,
  PenNib,
  Pricing,
} from "@/lib/supabase/jsonb-shapes";
import { formatArchive, hasClass, splitVariant } from "./format";
import { PenAttributeCards } from "./pen-attribute-cards";
import { WritingSamples } from "./writing-samples";
import type { PairingWithSides } from "@/lib/supabase/pairings";

export function buildPenReplace(
  pen: PenRow,
  pairings: PairingWithSides[] = [],
  totalPens = 0,
): HTMLReactParserOptions["replace"] {
  const nib = (pen.nib ?? {}) as PenNib;
  const ink = (pen.ink_delivery ?? {}) as PenInkDelivery;
  const body = (pen.body ?? {}) as PenBody;
  const dims = (pen.dimensions ?? {}) as PenDimensions;
  const pricing = (pen.pricing ?? {}) as Pricing;
  const editorial = (pen.editorial ?? {}) as Editorial;
  const variant = splitVariant(pen.variant);

  function penReplace(node: DOMNode) {
    if (!(node instanceof Element)) return undefined;

    if (node.name === "span" && hasClass(node, "crumb-mid")) {
      return (
        <span className="crumb-mid">
          {formatArchive(pen.archive_number)} — {pen.model}
        </span>
      );
    }

    // Breadcrumb — replace the whole <nav class="breadcrumb"> so the
    // "N / total" position indicator is live, not hard-coded. Falls
    // back to a single archive marker if totalPens is unknown.
    if (node.name === "nav" && hasClass(node, "breadcrumb")) {
      return (
        <nav className="breadcrumb">
          <span>
            <Link href="/">Almanac</Link> &nbsp;·&nbsp;{" "}
            <Link href="/#archive-pens">Pen Archive</Link> &nbsp;·&nbsp;{" "}
            <span className="crumb-mid">
              {formatArchive(pen.archive_number)} — {pen.model}
            </span>
          </span>
          <span>
            {pen.archive_number}
            {totalPens > 0 ? ` / ${totalPens}` : ""} &nbsp;·&nbsp;{" "}
            <a href="#" style={{ textDecoration: "underline" }}>
              ← Prev
            </a>{" "}
            &nbsp;&nbsp;{" "}
            <a href="#" style={{ textDecoration: "underline" }}>
              Next →
            </a>
          </span>
        </nav>
      );
    }

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

    if (node.name === "p" && hasClass(node, "deck")) {
      return <p className="deck">{editorial.deck ?? ""}</p>;
    }

    if (node.name === "div" && hasClass(node, "pen-hero-eyebrow")) {
      const price = pricing.msrpUsd != null ? `$ ${pricing.msrpUsd}` : "";
      return (
        <div className="pen-hero-eyebrow mono">
          <span>{formatArchive(pen.archive_number)} · Pen of the Archive</span>
          {pricing.priceTier ? <span>Tier {pricing.priceTier}</span> : null}
          {price ? <span>{price}</span> : null}
        </div>
      );
    }

    // Full 8-card attribute grid below the hero
    if (node.name === "div" && hasClass(node, "attr-groups")) {
      return <PenAttributeCards pen={pen} />;
    }

    // Writing-sample cards — real pairings featuring this pen.
    if (node.name === "div" && hasClass(node, "samples-grid")) {
      return <WritingSamples pairings={pairings} side="pen" />;
    }

    if (node.name === "div" && hasClass(node, "keyspecs")) {
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
            .filter((s) => s.v) // progressive disclosure
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
  }

  return penReplace;
}
