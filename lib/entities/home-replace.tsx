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
import {
  copy,
  numberToWords,
  ucfirst,
  type CopyMap,
} from "@/lib/supabase/page-copy";
import { CompareTray } from "@/components/CompareTray";
import { CompareGrid } from "@/components/CompareGrid";

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

export function buildHomeReplace(data: {
  pens: PenRow[];
  papers: PaperRow[];
  pairings: PairingWithSides[];
  pairingOfWeek: PairingWithSides | null;
  siteMeta: Record<string, string>;
  totals: { pens: number; papers: number; pairings: number; inks: number; total: number };
  pageCopy: CopyMap;
}): HTMLReactParserOptions["replace"] {
  const vars = {
    pen_count: data.totals.pens,
    paper_count: data.totals.papers,
    pairing_count: data.totals.pairings,
    ink_count: data.totals.inks,
    pen_count_words: ucfirst(numberToWords(data.totals.pens)),
    paper_count_words: ucfirst(numberToWords(data.totals.papers)),
    pairing_count_words: ucfirst(numberToWords(data.totals.pairings)),
    ink_count_words: ucfirst(numberToWords(data.totals.inks)),
    pairing_of_week_label: data.pairingOfWeek
      ? formatArchive(data.pairingOfWeek.archive_number)
      : "",
    pairing_of_week_archive: data.pairingOfWeek
      ? String(data.pairingOfWeek.archive_number).padStart(2, "0")
      : "",
  };

  // Render the editorial "Title <em>accent</em> rest." pattern from
  // a single template string by isolating the italic-emphasised word.
  // The DB stores plain text; we wrap whatever sits between the
  // dot/comma boundaries as the emphasised noun. For consistency with
  // the prototype, we italicise the last word before the comma.
  function renderTitleWithEmphasis(text: string, emphasisWord: string) {
    const idx = text.toLowerCase().indexOf(emphasisWord.toLowerCase());
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <em>{text.slice(idx, idx + emphasisWord.length)}</em>
        {text.slice(idx + emphasisWord.length)}
      </>
    );
  }

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

    // ─── Section heads (driven by page_copy) ──────────────────
    // Every <div class="section-head"> on home looks up its strings
    // from page_copy under home.<section_id>.{section_no,title_words,
    // kicker}. Keys use underscores; section ids use hyphens — we
    // normalize on lookup.
    if (node.name === "div" && hasClass(node, "section-head")) {
      const secRaw = enclosingSectionId(node);
      const sec = secRaw?.replace(/-/g, "_") ?? "";
      if (sec) {
        const titleTemplate = copy(data.pageCopy, `home.${sec}.title_words`, vars) ||
                              copy(data.pageCopy, `home.${sec}.title`, vars);
        const sectionNo = copy(data.pageCopy, `home.${sec}.section_no`, vars);
        const kicker = copy(data.pageCopy, `home.${sec}.kicker`, vars);
        // Find the emphasis word — the noun in the title that the
        // prototype italicises (pens / papers / marriages / etc.).
        const emphasisWord =
          sec === "archive_pens" ? "pens"
          : sec === "archive_papers" ? "papers"
          : sec === "pairings" ? "marriages"
          : sec === "picker" ? "mood"
          : sec === "principles" ? "meets"
          : sec === "compare" ? "weighed"
          : "";
        if (sectionNo || titleTemplate || kicker) {
          return (
            <div className="section-head">
              {sectionNo ? <span className="section-no">{sectionNo}</span> : null}
              {titleTemplate ? (
                <h2 className="section-title">
                  {emphasisWord
                    ? renderTitleWithEmphasis(titleTemplate, emphasisWord)
                    : titleTemplate}
                </h2>
              ) : null}
              {kicker ? <span className="section-kicker">{kicker}</span> : null}
            </div>
          );
        }
      }
    }

    // ─── Principles cards (5 fixed editorial cards) ──────────
    // Find this principle-card's index among its siblings and look up
    // the body copy. Principle titles ("Wetness × Absorbency") use the
    // class `principle-axis` in the prototype — italicising the × is
    // handled via title.replace; the editor writes the title with a
    // plain "×".
    function principleIndex(cardEl: Element): number {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const container: any = (cardEl as unknown as { parent?: unknown }).parent;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const siblings = ((container?.children ?? []) as any[]).filter(
        (c) => c instanceof Element && (c as Element).attribs?.class?.includes("principle-card"),
      );
      return siblings.indexOf(cardEl as unknown as never);
    }

    function renderPrincipleTitle(text: string) {
      const parts = text.split("×");
      if (parts.length < 2) return <>{text}</>;
      return (
        <>
          {parts[0]}
          <em>×</em>
          {parts.slice(1).join("×")}
        </>
      );
    }

    if (node.name === "h3" && hasClass(node, "principle-axis")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cardParent: any = (node as Element).parent;
      if (cardParent instanceof Element) {
        const idx = principleIndex(cardParent);
        if (idx >= 0) {
          const value = copy(data.pageCopy, `home.principles.p${idx + 1}.title`, vars);
          if (value) return <h3 className="principle-axis">{renderPrincipleTitle(value)}</h3>;
        }
      }
    }

    if (node.name === "p" && hasClass(node, "principle-body")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cardParent: any = (node as Element).parent;
      if (cardParent instanceof Element) {
        const idx = principleIndex(cardParent);
        if (idx >= 0) {
          const value = copy(data.pageCopy, `home.principles.p${idx + 1}.body`, vars);
          if (value) return <p className="principle-body">{value}</p>;
        }
      }
    }

    // ─── Featured pairing-of-the-week section ────────────────
    if (node.name === "section" && hasClass(node, "featured")) {
      return <FeaturedPairing pr={data.pairingOfWeek} />;
    }

    // ─── Sticky comparison tray (live state) ─────────────────
    if (
      node.name === "div" &&
      node.attribs.id === "tray" &&
      hasClass(node, "tray")
    ) {
      return <CompareTray />;
    }

    // ─── Compare section grid (live state) ───────────────────
    if (node.name === "div" && hasClass(node, "compare-grid")) {
      return <CompareGrid />;
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
