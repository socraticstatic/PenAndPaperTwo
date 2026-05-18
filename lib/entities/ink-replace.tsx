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

export function buildInkReplace(
  ink: InkRow,
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

    return undefined;
  }

  return inkReplace;
}
