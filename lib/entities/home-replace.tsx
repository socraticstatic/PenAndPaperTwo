import {
  type DOMNode,
  type HTMLReactParserOptions,
  Element,
} from "html-react-parser";
import type { PenRow } from "@/lib/supabase/pens";
import type { PaperRow } from "@/lib/supabase/papers";
import type { PairingWithSides } from "@/lib/supabase/pairings";
import type {
  Editorial,
  PaperAppearance,
  PaperSubstance,
  PenBody,
  PenDimensions,
  PenInkDelivery,
  PenNib,
  Pricing,
} from "@/lib/supabase/jsonb-shapes";
import { formatArchive, hasClass } from "./format";

// Find the enclosing <section id="…"> by walking up parents. html-
// react-parser exposes parent links on the parsed DOM, so we can
// disambiguate the two `<div class="archive-grid">` blocks on index.html.
function enclosingSectionId(node: Element): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = node.parent;
  while (cur) {
    if (cur.name === "section" && cur.attribs?.id) return cur.attribs.id;
    cur = cur.parent;
  }
  return null;
}

function isoCountry(name: string): string {
  const map: Record<string, string> = {
    Japan: "JP",
    "United Kingdom": "UK",
    "United States": "US",
    Germany: "DE",
    France: "FR",
    Italy: "IT",
  };
  return map[name] ?? name.slice(0, 2).toUpperCase();
}

function penCard(pen: PenRow) {
  const nib = (pen.nib ?? {}) as PenNib;
  const ink = (pen.ink_delivery ?? {}) as PenInkDelivery;
  const body = (pen.body ?? {}) as PenBody;
  const dims = (pen.dimensions ?? {}) as PenDimensions;
  const pricing = (pen.pricing ?? {}) as Pricing;
  return (
    <a key={pen.id} className="pen-card" href={`/pens/${pen.id}`}>
      <div className="card-top">
        <span className="card-no">{formatArchive(pen.archive_number)}</span>
        <span className="card-origin">
          {isoCountry(pen.country_of_origin)}
          {pen.year_introduced ? ` · ${pen.year_introduced}` : ""}
        </span>
      </div>
      <div className="card-brand">{pen.brand}</div>
      <h3 className="card-name">{pen.model}</h3>
      <div
        className="pen-silhouette"
        style={{ color: "oklch(28% 0.04 80)" }}
      ></div>
      <div className="attr-row">
        {nib.material && nib.size ? (
          <div className="attr">
            <span className="k">Nib</span>
            <span className="v">
              {nib.material.replace(/^Gold /, "")} · {nib.size}
            </span>
          </div>
        ) : null}
        {ink.fillingSystem ? (
          <div className="attr">
            <span className="k">Filler</span>
            <span className="v">
              {ink.fillingSystem.replace(/\s*\(.*\)$/, "").slice(0, 7)}
            </span>
          </div>
        ) : null}
        {ink.flow ? (
          <div className="attr">
            <span className="k">Flow</span>
            <span className="v">{ink.flow}</span>
          </div>
        ) : null}
        {dims.weightCappedG ? (
          <div className="attr">
            <span className="k">Weight</span>
            <span className="v">{dims.weightCappedG} g</span>
          </div>
        ) : null}
      </div>
      <div className="card-foot">
        {pricing.msrpUsd != null ? (
          <span className="price">$ {pricing.msrpUsd}</span>
        ) : null}
        {pricing.priceTier ? (
          <span className="tier">Tier {pricing.priceTier}</span>
        ) : (
          <span className="tier">{body.material ?? ""}</span>
        )}
      </div>
    </a>
  );
}

function paperCard(p: PaperRow) {
  const substance = (p.substance ?? {}) as PaperSubstance;
  const appearance = (p.appearance ?? {}) as PaperAppearance;
  const pricing = (p.pricing ?? {}) as Pricing;
  return (
    <a key={p.id} className="paper-card" href={`/papers/${p.id}`}>
      <div className="card-top">
        <span className="card-no">{formatArchive(p.archive_number)}</span>
        <span className="card-origin">
          {isoCountry(p.country_of_origin)}
          {p.year_introduced ? ` · ${p.year_introduced}` : ""}
        </span>
      </div>
      <div className="card-brand">{p.brand}</div>
      <h3 className="card-name">{p.model}</h3>
      <div
        className="paper-swatch"
        style={{
          background: appearance.colorHex ?? "oklch(94% 0.022 90)",
          height: 60,
          borderRadius: 4,
          margin: "16px 0",
        }}
      ></div>
      <div className="attr-row">
        {substance.gsm ? (
          <div className="attr">
            <span className="k">gsm</span>
            <span className="v">{substance.gsm}</span>
          </div>
        ) : null}
        {appearance.tone ? (
          <div className="attr">
            <span className="k">Tone</span>
            <span className="v">{appearance.tone}</span>
          </div>
        ) : null}
      </div>
      <div className="card-foot">
        {pricing.priceTier ? (
          <span className="tier">Tier {pricing.priceTier}</span>
        ) : null}
      </div>
    </a>
  );
}

function pairingTile(pr: PairingWithSides) {
  const editorial = (pr.editorial ?? {}) as Editorial;
  const pen = pr.pen;
  const paper = pr.paper;
  const moodOne = pr.mood?.[0] ?? "";
  const corner = pr.is_editors_choice
    ? "EDITOR’S CHOICE"
    : moodOne
      ? moodOne.toUpperCase()
      : "PAIRING";
  return (
    <a
      key={pr.id}
      className="pairing"
      href={`/pairings/${pr.id}`}
    >
      <div className="pairing-left">
        <span className="pairing-no">
          PAIRING {formatArchive(pr.archive_number)} · {corner}
        </span>
        <h3 className="pairing-title">
          {pen?.model ?? "—"} <em>×</em>
          <br />
          {paper?.model ?? "—"}
        </h3>
        {editorial.headline || editorial.deck ? (
          <p className="pairing-x">{editorial.headline ?? editorial.deck}</p>
        ) : null}
        {editorial.tastingNote ? (
          <div className="pairing-notes">
            <p>{editorial.tastingNote}</p>
          </div>
        ) : null}
      </div>
      <div className="pairing-right">
        <div className="pairing-score">
          <div className="score-cell">
            <span className="k">Affinity</span>
            <div className="v">{pr.affinity_score}</div>
          </div>
        </div>
      </div>
    </a>
  );
}

export function buildHomeReplace(data: {
  pens: PenRow[];
  papers: PaperRow[];
  pairings: PairingWithSides[];
}): HTMLReactParserOptions["replace"] {
  function homeReplace(node: DOMNode) {
    if (!(node instanceof Element)) return undefined;

    // The two `<div class="archive-grid">` blocks both have the same
    // class; disambiguate by enclosing section id.
    if (node.name === "div" && hasClass(node, "archive-grid")) {
      const section = enclosingSectionId(node);
      if (section === "archive-pens") {
        return (
          <div className="archive-grid">{data.pens.map(penCard)}</div>
        );
      }
      if (section === "archive-papers") {
        return (
          <div className="archive-grid">{data.papers.map(paperCard)}</div>
        );
      }
    }

    // Pairings catalogue (single `<div class="pairings">` on the page).
    if (node.name === "div" && hasClass(node, "pairings")) {
      return (
        <div className="pairings">{data.pairings.map(pairingTile)}</div>
      );
    }

    return undefined;
  }
  return homeReplace;
}
