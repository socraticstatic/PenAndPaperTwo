import parse, {
  type DOMNode,
  type HTMLReactParserOptions,
  Element,
} from "html-react-parser";
import type { Metadata } from "next";
import { loadPrototypePage } from "@/lib/prototype";
import { InlineScripts } from "@/components/InlineScripts";
import {
  fetchPairingById,
  type PairingEditorial,
  type PairingWithSides,
} from "@/lib/supabase/pairings";

const PAIRING_ID = "pairing-047";

export async function generateMetadata(): Promise<Metadata> {
  const pr = await fetchPairingById(PAIRING_ID);
  if (!pr?.pen || !pr.paper) return { title: "Pairing — Pen & Paper" };
  return {
    title: `Pairing № ${String(pr.archive_number).padStart(3, "0")} · ${pr.pen.model} × ${pr.paper.model} — Pen & Paper`,
  };
}

function hasClass(node: Element, name: string): boolean {
  return !!node.attribs.class?.split(/\s+/).includes(name);
}

function formatArchive(n: number) {
  return `№ ${String(n).padStart(3, "0")}`;
}

function buildReplace(pr: PairingWithSides): HTMLReactParserOptions["replace"] {
  const editorial = (pr.editorial ?? {}) as PairingEditorial;
  const pen = pr.pen;
  const paper = pr.paper;
  const moodOne = pr.mood?.[0] ?? "";

  function pairingReplace(node: DOMNode) {
    if (!(node instanceof Element)) return undefined;

    if (node.name === "span" && hasClass(node, "crumb-mid")) {
      const label = pen && paper ? `${pen.model} × ${paper.model}` : pr.id;
      return (
        <span className="crumb-mid">
          {formatArchive(pr.archive_number)} — {label}
        </span>
      );
    }

    // Hero H1: <penModel><span class="x">×</span><paperModel>
    if (node.name === "h1") {
      return (
        <h1>
          {pen?.model ?? "—"}
          <span className="x">×</span>
          {paper?.model ?? "—"}
        </h1>
      );
    }

    if (node.name === "p" && hasClass(node, "pp-deck")) {
      return <p className="pp-deck">{editorial.deck ?? ""}</p>;
    }

    if (node.name === "div" && hasClass(node, "pairing-hero-eyebrow")) {
      const useMood = moodOne
        ? `${pr.use_case} · ${moodOne}`
        : pr.use_case;
      return (
        <div className="pairing-hero-eyebrow mono">
          <span>Pairing {formatArchive(pr.archive_number)}</span>
          {pr.is_editors_choice ? (
            <span className="badge">Editor&rsquo;s Choice</span>
          ) : null}
          <span>{useMood}</span>
          <span>Affinity {pr.affinity_score} / 100</span>
        </div>
      );
    }

    return undefined;
  }

  return pairingReplace;
}

export default async function PairingPage() {
  const [pairing, page] = await Promise.all([
    fetchPairingById(PAIRING_ID),
    loadPrototypePage("pairing.html"),
  ]);

  if (!pairing) {
    return (
      <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
        <h1>Pairing not found</h1>
        <p>
          No row in <code>public.pairings</code> with{" "}
          <code>id = {PAIRING_ID}</code>. Seed{" "}
          <code>supabase/seeds/04_pairing_047_823_x_tomoe.sql</code>.
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
      {parse(page.bodyHtml, { replace: buildReplace(pairing) })}
      <InlineScripts scripts={page.inlineScripts} />
    </>
  );
}
