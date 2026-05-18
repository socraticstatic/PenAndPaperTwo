import {
  type DOMNode,
  type HTMLReactParserOptions,
  Element,
} from "html-react-parser";
import type { PaperRow } from "@/lib/supabase/papers";
import type {
  Editorial,
  PaperAppearance,
  PaperPerformance,
  PaperSubstance,
  PaperSurface,
  Pricing,
} from "@/lib/supabase/jsonb-shapes";
import { formatArchive, hasClass } from "./format";

function sheenLabel(score: number): string {
  return (
    ["Matte", "Subdued", "Visible", "Pronounced", "Marked"][score - 1] ??
    String(score)
  );
}

function tendencyLabel(score: number): string {
  return (
    ["Nil", "Faint", "Visible", "Marked", "Bleed"][score - 1] ?? String(score)
  );
}

export function buildPaperReplace(
  p: PaperRow,
): HTMLReactParserOptions["replace"] {
  const substance = (p.substance ?? {}) as PaperSubstance;
  const surface = (p.surface ?? {}) as PaperSurface;
  const performance = (p.performance ?? {}) as PaperPerformance;
  const appearance = (p.appearance ?? {}) as PaperAppearance;
  const pricing = (p.pricing ?? {}) as Pricing;
  const editorial = (p.editorial ?? {}) as Editorial;

  function paperReplace(node: DOMNode) {
    if (!(node instanceof Element)) return undefined;

    if (node.name === "span" && hasClass(node, "crumb-mid")) {
      return (
        <span className="crumb-mid">
          {formatArchive(p.archive_number)} — {p.model}
        </span>
      );
    }

    if (node.name === "h1") {
      // Prototype line-break shape: brand-or-first-word / rest-with-italic-S /
      // gsm. Mirrors "Tomoe / River S / 52 gsm". Lossy on non-S models,
      // but it's the prototype's editorial conceit, kept as best-effort.
      const parts = p.model.split(/\s+/);
      const first = parts[0] ?? "";
      const rest = parts.slice(1).join(" ");
      const gsm = substance.gsm ? `${substance.gsm} gsm` : "";
      const trailingLetter = /^.* ([A-Z])$/.exec(rest)?.[1] ?? null;
      const restWithoutTrailing = trailingLetter
        ? rest.slice(0, -2)
        : rest;
      return (
        <h1>
          {first}
          {rest && (
            <>
              <br />
              {restWithoutTrailing}{" "}
              {trailingLetter ? <em>{trailingLetter}</em> : null}
            </>
          )}
          {gsm && (
            <>
              <br />
              {gsm}
            </>
          )}
        </h1>
      );
    }

    if (node.name === "p" && hasClass(node, "deck")) {
      return <p className="deck">{editorial.deck ?? ""}</p>;
    }

    if (node.name === "div" && hasClass(node, "paper-hero-eyebrow")) {
      const tone = appearance.tone?.toUpperCase();
      const gsmTone =
        substance.gsm && tone
          ? `${substance.gsm} GSM · ${tone}`
          : substance.gsm
            ? `${substance.gsm} GSM`
            : "";
      return (
        <div className="paper-hero-eyebrow mono">
          <span>{formatArchive(p.archive_number)} · Paper of the Archive</span>
          {gsmTone ? <span>{gsmTone}</span> : null}
          {pricing.fromPriceLabel ? (
            <span>{pricing.fromPriceLabel}</span>
          ) : pricing.priceTier ? (
            <span>Tier {pricing.priceTier}</span>
          ) : null}
        </div>
      );
    }

    if (node.name === "div" && hasClass(node, "keyspecs")) {
      const dryM = performance.dryTimeByNib?.M;
      const specs: Array<{ k: string; v: string | null | undefined }> = [
        { k: "Weight", v: substance.gsm ? `${substance.gsm} gsm` : null },
        { k: "Tooth", v: surface.tooth },
        {
          k: "Sheen",
          v:
            performance.sheenVisibility != null
              ? sheenLabel(performance.sheenVisibility)
              : null,
        },
        {
          k: "Bleed",
          v:
            performance.bleedThroughTendency != null
              ? tendencyLabel(performance.bleedThroughTendency)
              : null,
        },
        { k: "Tone", v: appearance.tone },
        { k: "Dry time", v: dryM ? `${dryM} s` : null },
      ];
      return (
        <div className="keyspecs">
          {specs
            .filter((s) => s.v)
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

  return paperReplace;
}
