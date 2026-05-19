import Link from "next/link";
import {
  type DOMNode,
  type HTMLReactParserOptions,
  Element,
} from "html-react-parser";
import type { InkRow } from "@/lib/supabase/inks";
import type {
  Editorial,
  InkPerformance,
  Pricing,
} from "@/lib/supabase/jsonb-shapes";
import { formatArchive, hasClass } from "./format";
import { InkAttributeCards } from "./ink-attribute-cards";
import { AddToCompareButton } from "@/components/AddToCompareButton";

export function buildInkReplace(
  ink: InkRow,
  totalInks = 0,
): HTMLReactParserOptions["replace"] {
  const performance = (ink.performance ?? {}) as InkPerformance;
  const pricing = (ink.pricing ?? {}) as Pricing;
  const editorial = (ink.editorial ?? {}) as Editorial;

  function inkReplace(node: DOMNode) {
    if (!(node instanceof Element)) return undefined;

    if (node.name === "span" && hasClass(node, "crumb-mid")) {
      return (
        <span className="crumb-mid">
          {formatArchive(ink.archive_number)} — {ink.model}
        </span>
      );
    }

    if (node.name === "nav" && hasClass(node, "breadcrumb")) {
      return (
        <nav className="breadcrumb">
          <span>
            <Link href="/">Almanac</Link> &nbsp;·&nbsp;{" "}
            <Link href="/ink">Ink Cupboard</Link> &nbsp;·&nbsp;{" "}
            <span className="crumb-mid">
              {formatArchive(ink.archive_number)} — {ink.model}
            </span>
          </span>
          <span>
            {ink.archive_number}
            {totalInks > 0 ? ` / ${totalInks}` : ""} &nbsp;·&nbsp;{" "}
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
      const eng = ink.model_english ?? "";
      const engParts = eng.split(/\s+/);
      return (
        <h1>
          {ink.model}
          {eng && (
            <>
              <br />
              <em>{engParts[0]}</em>
              <br />
              {engParts.slice(1).join(" ")}
            </>
          )}
        </h1>
      );
    }

    if (node.name === "p" && hasClass(node, "deck")) {
      return <p className="deck">{editorial.deck ?? ""}</p>;
    }

    if (node.name === "div" && hasClass(node, "ink-hero-eyebrow")) {
      const familySheen =
        performance.sheenVisibility != null
          ? `${ink.family} · ${performance.sheenVisibility}/5`
          : ink.family;
      const price =
        pricing.msrpUsd != null
          ? `$ ${pricing.msrpUsd}${pricing.bottleMl ? ` / ${pricing.bottleMl} ml` : ""}`
          : null;
      return (
        <div className="ink-hero-eyebrow mono">
          <span>{formatArchive(ink.archive_number)} · Ink of the Cupboard</span>
          {familySheen ? <span>{familySheen}</span> : null}
          {price ? <span>{price}</span> : null}
        </div>
      );
    }

    // Full 6-card attribute grid below the hero
    if (node.name === "div" && hasClass(node, "attr-groups")) {
      return <InkAttributeCards ink={ink} />;
    }

    // Writing-sample cards. The ink's relationship to specific papers
    // would need an `ink_paper_observation` table we don't yet model.
    // Render empty (no fake substitutes) until that engine exists.
    if (node.name === "div" && hasClass(node, "samples-grid")) {
      return <div className="samples-grid" />;
    }

    if (node.name === "div" && hasClass(node, "acts")) {
      const color = (ink.color ?? {}) as Record<string, unknown>;
      return (
        <div className="acts">
          <a href="#pairings-here" className="primary">
            See its pairings →
          </a>
          <AddToCompareButton
            item={{
              id: ink.id,
              kind: "ink",
              brand: ink.brand,
              model: ink.model,
              variant: ink.variant ?? undefined,
              archiveNumber: ink.archive_number,
              hex: (color.hex as string | undefined) ?? "#222",
            }}
          />
        </div>
      );
    }

    return undefined;
  }

  return inkReplace;
}
