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

// ─── Featured "Pairing of the week" hero ───────────────────────
function FeaturedPairing({ pr }: { pr: PairingWithSides | null }) {
  if (!pr || !pr.pen || !pr.paper) {
    // Honest empty state. The editor hasn't flagged a pairing this week.
    return (
      <section className="featured">
        <div className="wrap">
          <div className="featured-eyebrow mono">
            <span>No pairing selected this week</span>
          </div>
        </div>
      </section>
    );
  }
  const editorial = (pr.editorial ?? {}) as Editorial;
  const measurements = pr.measurements as Record<string, unknown> | null;
  return (
    <section className="featured">
      <div className="wrap">
        <div className="featured-eyebrow mono">
          <span>Pairing of the Week — {formatArchive(pr.archive_number)}</span>
          <span>Selected by the Editors</span>
          {pr.updated_at ? (
            <span>Updated {pr.updated_at.slice(0, 10)}</span>
          ) : null}
        </div>

        <div className="featured-grid">
          <div className="featured-pen slot-frame">
            <span className="placeholder-corner">PEN</span>
          </div>

          <div className="featured-center">
            <div>
              <span className="featured-no">
                PAIRING {formatArchive(pr.archive_number)} ·{" "}
                {pr.is_editors_choice
                  ? "EDITOR’S CHOICE"
                  : (pr.mood?.[0] ?? "MARRIAGE").toUpperCase()}
              </span>
              <h2 className="featured-title">
                {pr.pen.model}
                <br />
                <em>×</em>
                <br />
                {pr.paper.model}
              </h2>
              {editorial.deck ? (
                <p className="featured-sub">{editorial.deck}</p>
              ) : null}
              {editorial.tastingNote ? (
                <p className="featured-body">{editorial.tastingNote}</p>
              ) : null}
            </div>

            <div className="featured-meta">
              <div className="meta-row">
                <span className="meta-k">Affinity</span>
                <span className="meta-v">{pr.affinity_score} / 100</span>
              </div>
              <div className="meta-row">
                <span className="meta-k">Use</span>
                <span className="meta-v">{pr.use_case}</span>
              </div>
              {pr.mood?.[0] ? (
                <div className="meta-row">
                  <span className="meta-k">Mood</span>
                  <span className="meta-v">{pr.mood[0]}</span>
                </div>
              ) : null}
              {measurements && typeof measurements.sheenObserved === "string" ? (
                <div className="meta-row">
                  <span className="meta-k">Sheen</span>
                  <span className="meta-v">
                    {measurements.sheenObserved as string}
                  </span>
                </div>
              ) : null}
            </div>

            <a href={`/pairings/${pr.id}`} className="featured-link">
              Read the pairing in full →
            </a>
          </div>

          <div className="featured-paper slot-frame">
            <span className="placeholder-corner">PAPER</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Comparison tray (empty state) ─────────────────────────────
// Renders 4 empty slots. NOT fake-populated. The real compare engine
// (state, add/remove, persist) lives in the roadmap, not here.
function ComparisonTrayEmpty() {
  return (
    <div className="tray" id="tray">
      <div className="tray-handle" id="tray-handle">
        <span className="h-eyebrow">Comparison flight</span>
        <span className="h-title">
          0 <em>of 4</em> specimens
        </span>
      </div>
      <div className="tray-slots">
        {["i.", "ii.", "iii.", "iv."].map((n) => (
          <div className="tray-slot empty" key={n}>
            <span className="tray-num">{n}</span>
            <span className="ts-plus">+</span>
            <div>
              <div className="ts-name">Add a specimen</div>
              <span className="ts-sub">Pen or paper</span>
            </div>
            <span></span>
          </div>
        ))}
      </div>
      <div className="tray-actions">
        <a href="#compare" className="primary">Open compare →</a>
      </div>
    </div>
  );
}

export function buildHomeReplace(data: {
  pens: PenRow[];
  papers: PaperRow[];
  pairings: PairingWithSides[];
  pairingOfWeek: PairingWithSides | null;
  siteMeta: Record<string, string>;
  totals: { total: number };
}): HTMLReactParserOptions["replace"] {
  function homeReplace(node: DOMNode) {
    if (!(node instanceof Element)) return undefined;

    // ─── Topbar meta ─────────────────────────────────────────
    if (node.name === "div" && hasClass(node, "topbar-meta")) {
      return (
        <div className="topbar-meta">
          {data.siteMeta.topbar_volume_label ? (
            <span>
              <span className="dot"></span>
              {data.siteMeta.topbar_volume_label}
            </span>
          ) : null}
          {data.siteMeta.topbar_tagline ? (
            <span>{data.siteMeta.topbar_tagline}</span>
          ) : null}
          <span>Search ⌘K</span>
        </div>
      );
    }

    // ─── Masthead issue line + tagline block ─────────────────
    if (node.name === "div" && hasClass(node, "masthead-issue")) {
      const totalLabel =
        data.totals.total > 0 ? `${data.totals.total} Entries` : null;
      return (
        <div className="masthead-issue">
          {data.siteMeta.masthead_volume_no ? (
            <span className="mono">{data.siteMeta.masthead_volume_no}</span>
          ) : null}
          {data.siteMeta.masthead_issue_date ? (
            <span className="mono">{data.siteMeta.masthead_issue_date}</span>
          ) : null}
          {data.siteMeta.masthead_tagline ? (
            <span className="mono">{data.siteMeta.masthead_tagline}</span>
          ) : null}
          {totalLabel ? <span className="mono">{totalLabel}</span> : null}
          {data.siteMeta.masthead_editors ? (
            <span className="mono">{data.siteMeta.masthead_editors}</span>
          ) : null}
        </div>
      );
    }

    if (node.name === "div" && hasClass(node, "masthead-tag")) {
      const skipId = data.pairingOfWeek?.id;
      return (
        <div className="masthead-tag">
          {data.siteMeta.masthead_tag_mono ? (
            <span
              className="mono"
              dangerouslySetInnerHTML={{
                __html: data.siteMeta.masthead_tag_mono.replace(/\n/g, "<br>"),
              }}
            />
          ) : null}
          {data.siteMeta.masthead_tag_lede ? (
            <p className="lede">{data.siteMeta.masthead_tag_lede}</p>
          ) : null}
          <span className="mono" style={{ textAlign: "right" }}>
            Begin below ↓<br />
            {skipId ? (
              <>
                Or skip to{" "}
                <a
                  href={`/pairings/${skipId}`}
                  style={{ textDecoration: "underline" }}
                >
                  No.{" "}
                  {String(data.pairingOfWeek!.archive_number).padStart(2, "0")}{" "}
                  →
                </a>
              </>
            ) : null}
          </span>
        </div>
      );
    }

    // ─── Featured pairing-of-the-week section ────────────────
    if (node.name === "section" && hasClass(node, "featured")) {
      return <FeaturedPairing pr={data.pairingOfWeek} />;
    }

    // ─── Sticky comparison tray (empty state) ────────────────
    if (
      node.name === "div" &&
      node.attribs.id === "tray" &&
      hasClass(node, "tray")
    ) {
      return <ComparisonTrayEmpty />;
    }

    // ─── Picker result list (engine not yet wired) ───────────
    // The real engine = 5-axis Euclidean match RPC over `pairings`.
    // Until that exists, render the head + an empty body — never
    // the prototype's three hard-coded sample results.
    if (node.name === "aside" && hasClass(node, "picker-results")) {
      return (
        <aside className="picker-results">
          <div className="picker-results-head">
            <span className="pr-eyebrow">Matches</span>
            <div className="pr-count">
              <em data-out="count">—</em> marriages match
            </div>
            <span className="pr-meta">Engine not yet wired</span>
          </div>
        </aside>
      );
    }

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
