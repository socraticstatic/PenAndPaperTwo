import parse, {
  type DOMNode,
  type HTMLReactParserOptions,
  Element,
} from "html-react-parser";
import type { Metadata } from "next";
import { loadPrototypePage } from "@/lib/prototype";
import { InlineScripts } from "@/components/InlineScripts";
import {
  fetchPaperById,
  type PaperAppearance,
  type PaperEditorial,
  type PaperPerformance,
  type PaperPricing,
  type PaperRow,
  type PaperSubstance,
  type PaperSurface,
} from "@/lib/supabase/papers";

const PAPER_ID = "tomoe-river-s";

export async function generateMetadata(): Promise<Metadata> {
  const p = await fetchPaperById(PAPER_ID);
  return { title: p ? `${p.model} — Pen & Paper` : "Paper — Pen & Paper" };
}

function hasClass(node: Element, name: string): boolean {
  return !!node.attribs.class?.split(/\s+/).includes(name);
}

function formatArchive(n: number) {
  return `№ ${String(n).padStart(3, "0")}`;
}

function buildReplace(p: PaperRow): HTMLReactParserOptions["replace"] {
  const substance = (p.substance ?? {}) as PaperSubstance;
  const surface = (p.surface ?? {}) as PaperSurface;
  const performance = (p.performance ?? {}) as PaperPerformance;
  const appearance = (p.appearance ?? {}) as PaperAppearance;
  const pricing = (p.pricing ?? {}) as PaperPricing;
  const editorial = (p.editorial ?? {}) as PaperEditorial;

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
      // Prototype: "Tomoe / River S / 52 gsm" — three lines, mill+model split
      // on space and the gsm pulled in. Mirror that shape from DB fields.
      const parts = p.model.split(/\s+/);
      const first = parts[0] ?? "";
      const rest = parts.slice(1).join(" ");
      const gsm = substance.gsm ? `${substance.gsm} gsm` : "";
      return (
        <h1>
          {first}
          <br />
          {rest && (
            <>
              {rest.split(/\s(?=S$)/)[0]}{" "}
              {/^.* (S|N)$/.test(rest) ? <em>{rest.slice(-1)}</em> : null}
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

function sheenLabel(score: number): string {
  return ["Matte", "Subdued", "Visible", "Pronounced", "Marked"][score - 1] ??
    String(score);
}

function tendencyLabel(score: number): string {
  return ["Nil", "Faint", "Visible", "Marked", "Bleed"][score - 1] ??
    String(score);
}

export default async function PaperPage() {
  const [paper, page] = await Promise.all([
    fetchPaperById(PAPER_ID),
    loadPrototypePage("paper.html"),
  ]);

  if (!paper) {
    return (
      <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
        <h1>Paper not found</h1>
        <p>
          No row in <code>public.papers</code> with{" "}
          <code>id = {PAPER_ID}</code>. Seed{" "}
          <code>supabase/seeds/02_tomoe_river_s.sql</code>.
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
      {parse(page.bodyHtml, { replace: buildReplace(paper) })}
      <InlineScripts scripts={page.inlineScripts} />
    </>
  );
}
