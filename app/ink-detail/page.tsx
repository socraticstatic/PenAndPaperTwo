import parse, {
  type DOMNode,
  type HTMLReactParserOptions,
  Element,
} from "html-react-parser";
import type { Metadata } from "next";
import { loadPrototypePage } from "@/lib/prototype";
import { InlineScripts } from "@/components/InlineScripts";
import {
  fetchInkById,
  type InkEditorial,
  type InkPerformance,
  type InkPricing,
  type InkRow,
} from "@/lib/supabase/inks";

const INK_ID = "iroshizuku-tsuki-yo";

export async function generateMetadata(): Promise<Metadata> {
  const i = await fetchInkById(INK_ID);
  return {
    title: i ? `${i.brand} ${i.model} — Pen & Paper` : "Ink — Pen & Paper",
  };
}

function hasClass(node: Element, name: string): boolean {
  return !!node.attribs.class?.split(/\s+/).includes(name);
}

function formatArchive(n: number) {
  return `№ ${String(n).padStart(3, "0")}`;
}

function buildReplace(ink: InkRow): HTMLReactParserOptions["replace"] {
  const performance = (ink.performance ?? {}) as InkPerformance;
  const pricing = (ink.pricing ?? {}) as InkPricing;
  const editorial = (ink.editorial ?? {}) as InkEditorial;

  function inkReplace(node: DOMNode) {
    if (!(node instanceof Element)) return undefined;

    if (node.name === "span" && hasClass(node, "crumb-mid")) {
      return (
        <span className="crumb-mid">
          {formatArchive(ink.archive_number)} — {ink.model}
        </span>
      );
    }

    // H1: model · <em>english-first-word</em> · english-rest
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
      const sheen =
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
          {sheen ? <span>{sheen}</span> : null}
          {price ? <span>{price}</span> : null}
        </div>
      );
    }

    return undefined;
  }

  return inkReplace;
}

export default async function InkDetailPage() {
  const [ink, page] = await Promise.all([
    fetchInkById(INK_ID),
    loadPrototypePage("ink-detail.html"),
  ]);

  if (!ink) {
    return (
      <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
        <h1>Ink not found</h1>
        <p>
          No row in <code>public.inks</code> with <code>id = {INK_ID}</code>.
          Seed <code>supabase/seeds/03_iroshizuku_tsuki_yo.sql</code>.
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
      {parse(page.bodyHtml, { replace: buildReplace(ink) })}
      <InlineScripts scripts={page.inlineScripts} />
    </>
  );
}
