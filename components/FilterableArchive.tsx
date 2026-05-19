"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";

// Generic filterable archive grid + chip facet bar. The server passes
// `kind` + serialized `rows`; this client component knows the facet
// definitions and card renderers per kind. Chips show live counts;
// clicking toggles the facet; AND across groups, OR within. Session-
// scoped state — at scale, swap initialRows for a server query and
// add URL params.

type Kind = "pen" | "paper" | "ink" | "pairing";

// Loose row shape — we read into JSONB columns dynamically per kind.
type Row = {
  id: string;
  brand?: string;
  model?: string;
  variant?: string | null;
  archive_number: number;
  country_of_origin?: string;
  year_introduced?: number | null;
  mill?: string | null;
  family?: string;
  hue_family?: string;
  warmth?: string;
  use_case?: string;
  mood?: string[];
  is_editors_choice?: boolean;
  affinity_score?: number;
  // Pairing rows include nested pen/paper from the FK select
  pen?: Row;
  paper?: Row;
  // JSONB columns — accessed as plain objects
  nib?: Record<string, unknown>;
  ink_delivery?: Record<string, unknown>;
  body?: Record<string, unknown>;
  dimensions?: Record<string, unknown>;
  pricing?: Record<string, unknown>;
  performance?: Record<string, unknown>;
  surface?: Record<string, unknown>;
  appearance?: Record<string, unknown>;
  substance?: Record<string, unknown>;
  format?: Record<string, unknown>;
  color?: Record<string, unknown>;
  chemistry?: Record<string, unknown>;
  editorial?: Record<string, unknown>;
};

type FacetDef = {
  key: string;
  label: string;
  getValues: (row: Row) => string[];
  order?: string[];
};

const FACETS_BY_KIND: Record<Kind, FacetDef[]> = {
  pen: [
    {
      key: "nib_material",
      label: "Nib material",
      getValues: (r) => single(r.nib?.["material"]),
    },
    {
      key: "nib_size",
      label: "Nib size",
      order: ["UEF", "EF", "F", "MF", "M", "B", "BB", "BBB", "Stub", "Flex"],
      getValues: (r) => single(r.nib?.["sizeNormalized"]),
    },
    {
      key: "flex",
      label: "Flex",
      order: ["Rigid", "Soft", "Semi-flex", "Flex"],
      getValues: (r) => single(r.nib?.["flex"]),
    },
    {
      key: "filler",
      label: "Filler",
      getValues: (r) => {
        const v = r.ink_delivery?.["fillingSystem"];
        return typeof v === "string" ? [v.replace(/\s*\(.*\)$/, "")] : [];
      },
    },
    {
      key: "body_material",
      label: "Body",
      getValues: (r) => single(r.body?.["material"]),
    },
    {
      key: "country",
      label: "Country",
      getValues: (r) => (r.country_of_origin ? [r.country_of_origin] : []),
    },
    {
      key: "price_tier",
      label: "Tier",
      order: ["I", "II", "III", "IV", "V", "VI"],
      getValues: (r) => single(r.pricing?.["priceTier"]),
    },
  ],
  paper: [
    {
      key: "tooth",
      label: "Tooth",
      order: ["Glass", "Smooth", "Sized", "Soft tooth", "Toothy", "Coarse", "Hand-laid"],
      getValues: (r) => single(r.surface?.["tooth"]),
    },
    {
      key: "tone",
      label: "Tone",
      order: ["Bright", "Ivory", "Cream", "Warm"],
      getValues: (r) => single(r.appearance?.["tone"]),
    },
    {
      key: "format_kind",
      label: "Format",
      getValues: (r) => single(r.format?.["kind"]),
    },
    {
      key: "country",
      label: "Country",
      getValues: (r) => (r.country_of_origin ? [r.country_of_origin] : []),
    },
    {
      key: "mill",
      label: "Mill",
      getValues: (r) => (r.mill ? [r.mill] : []),
    },
  ],
  ink: [
    {
      key: "family",
      label: "Family",
      order: ["Standard", "Dye", "Pigment", "Iron gall", "Shimmer", "Sheening", "Bulletproof", "Mixable"],
      getValues: (r) => (r.family ? [r.family] : []),
    },
    {
      key: "hue_family",
      label: "Hue",
      order: ["Black", "Blue-black", "Blue", "Teal", "Green", "Purple", "Burgundy", "Red", "Brown", "Orange", "Yellow", "Pink", "Grey"],
      getValues: (r) => (r.hue_family ? [r.hue_family] : []),
    },
    {
      key: "warmth",
      label: "Warmth",
      order: ["Cool", "Neutral", "Warm"],
      getValues: (r) => (r.warmth ? [r.warmth] : []),
    },
    {
      key: "country",
      label: "Country",
      getValues: (r) => (r.country_of_origin ? [r.country_of_origin] : []),
    },
    {
      key: "safe_demonstrator",
      label: "Safe for demonstrators",
      getValues: (r) => {
        const v = r.chemistry?.["safeForDemonstrator"];
        if (v === true) return ["Yes"];
        if (v === false) return ["No"];
        return [];
      },
    },
  ],
  pairing: [
    {
      key: "use_case",
      label: "Use",
      getValues: (r) => (r.use_case ? [r.use_case] : []),
    },
    {
      key: "mood",
      label: "Mood",
      getValues: (r) => r.mood ?? [],
    },
    {
      key: "editors_choice",
      label: "Editor’s pick",
      getValues: (r) => (r.is_editors_choice ? ["Editor’s Choice"] : []),
    },
  ],
};

function single(v: unknown): string[] {
  return typeof v === "string" && v.length ? [v] : [];
}

function isoCountry(name?: string): string {
  if (!name) return "";
  const map: Record<string, string> = {
    Japan: "JP", "United Kingdom": "UK", "United States": "US",
    Germany: "DE", France: "FR", Italy: "IT", Switzerland: "CH",
    Taiwan: "TW", China: "CN", Austria: "AT", Australia: "AU",
  };
  return map[name] ?? name.slice(0, 2).toUpperCase();
}

function formatArchive(n: number): string {
  return `№ ${String(n).padStart(3, "0")}`;
}

// ─── card renderers per kind ───────────────────────────────────────────

function renderPen(r: Row) {
  const nib = r.nib ?? {};
  const ink = r.ink_delivery ?? {};
  const body = r.body ?? {};
  const dims = r.dimensions ?? {};
  const pricing = r.pricing ?? {};
  return (
    <a key={r.id} className="pen-card" href={`/pens/${r.id}`}>
      <div className="card-top">
        <span className="card-no">{formatArchive(r.archive_number)}</span>
        <span className="card-origin">
          {isoCountry(r.country_of_origin)}
          {r.year_introduced ? ` · ${r.year_introduced}` : ""}
        </span>
      </div>
      <div className="card-brand">{r.brand}</div>
      <h3 className="card-name">{r.model}</h3>
      <div className="pen-silhouette" style={{ color: "oklch(28% 0.04 80)" }} />
      <div className="attr-row">
        {nib["material"] && nib["size"] ? (
          <div className="attr">
            <span className="k">Nib</span>
            <span className="v">
              {String(nib["material"]).replace(/^Gold /, "")} · {String(nib["size"])}
            </span>
          </div>
        ) : null}
        {ink["fillingSystem"] ? (
          <div className="attr">
            <span className="k">Filler</span>
            <span className="v">
              {String(ink["fillingSystem"]).replace(/\s*\(.*\)$/, "").slice(0, 7)}
            </span>
          </div>
        ) : null}
        {ink["flow"] ? (
          <div className="attr">
            <span className="k">Flow</span>
            <span className="v">{String(ink["flow"])}</span>
          </div>
        ) : null}
        {dims["weightCappedG"] != null ? (
          <div className="attr">
            <span className="k">Weight</span>
            <span className="v">{String(dims["weightCappedG"])} g</span>
          </div>
        ) : null}
      </div>
      <div className="card-foot">
        {pricing["msrpUsd"] != null ? (
          <span className="price">$ {String(pricing["msrpUsd"])}</span>
        ) : null}
        {pricing["priceTier"] ? (
          <span className="tier">Tier {String(pricing["priceTier"])}</span>
        ) : (
          <span className="tier">{String(body["material"] ?? "")}</span>
        )}
      </div>
    </a>
  );
}

function renderPaper(r: Row) {
  const substance = r.substance ?? {};
  const appearance = r.appearance ?? {};
  const pricing = r.pricing ?? {};
  return (
    <a key={r.id} className="paper-card" href={`/papers/${r.id}`}>
      <div className="card-top">
        <span className="card-no">{formatArchive(r.archive_number)}</span>
        <span className="card-origin">
          {isoCountry(r.country_of_origin)}
          {r.year_introduced ? ` · ${r.year_introduced}` : ""}
        </span>
      </div>
      <div className="card-brand">{r.brand}</div>
      <h3 className="card-name">{r.model}</h3>
      <div
        className="paper-swatch"
        style={{
          background: String(appearance["colorHex"] ?? "oklch(94% 0.022 90)"),
          height: 60,
          borderRadius: 4,
          margin: "16px 0",
        }}
      />
      <div className="attr-row">
        {substance["gsm"] != null ? (
          <div className="attr">
            <span className="k">gsm</span>
            <span className="v">{String(substance["gsm"])}</span>
          </div>
        ) : null}
        {appearance["tone"] ? (
          <div className="attr">
            <span className="k">Tone</span>
            <span className="v">{String(appearance["tone"])}</span>
          </div>
        ) : null}
      </div>
      <div className="card-foot">
        {pricing["priceTier"] ? (
          <span className="tier">Tier {String(pricing["priceTier"])}</span>
        ) : null}
      </div>
    </a>
  );
}

function renderInk(r: Row) {
  const color = r.color ?? {};
  const performance = r.performance ?? {};
  const pricing = r.pricing ?? {};
  const sheen = Number(performance["sheenVisibility"] ?? 0);
  const shimmer = Number(performance["shimmerVisibility"] ?? 0);
  const marks: string[] = [];
  if (sheen >= 4) marks.push("SHEEN");
  if (shimmer >= 3) marks.push("SHIMMER");
  const style: CSSProperties & Record<string, string> = {
    ["--ink-color"]: String(color["oklch"] ?? color["hex"] ?? "#1c2c47"),
    ["--ink-shade-low"]: String(color["shadingLow"] ?? "#0e1828"),
    ["--ink-sheen"]: String(color["sheenHex"] ?? "#b87333"),
  };
  return (
    <a key={r.id} className="ink-card" href={`/inks/${r.id}`} style={style}>
      <div className="card-top">
        <span className="card-no">{formatArchive(r.archive_number)}</span>
        <span className="card-origin">
          {isoCountry(r.country_of_origin)}
          {r.year_introduced ? ` · ${r.year_introduced}` : ""}
        </span>
      </div>
      <div className="ink-swatch">
        {color["hex"] ? (
          <span className="swatch-tag">{String(color["hex"]).toUpperCase()}</span>
        ) : null}
        {marks.length ? (
          <span className="swatch-marks">
            {marks.map((m) => (
              <span key={m} className="m">{m}</span>
            ))}
          </span>
        ) : null}
        <span className="sheen-stripe" />
        <span className="writing">{String(color["name"] ?? r.model)}</span>
      </div>
      <div>
        <div className="card-brand">{r.brand}</div>
        <h3 className="card-name">{r.model}</h3>
      </div>
      <div className="card-foot">
        <span className="fam">{r.family}</span>
        {pricing["msrpUsd"] != null ? (
          <span className="price">
            $ {String(pricing["msrpUsd"])}
            {pricing["bottleMl"] ? ` / ${String(pricing["bottleMl"])} ml` : ""}
          </span>
        ) : null}
      </div>
    </a>
  );
}

function renderPairing(r: Row) {
  const editorial = r.editorial ?? {};
  const pen = r.pen;
  const paper = r.paper;
  const moodOne = r.mood?.[0] ?? "";
  const corner = r.is_editors_choice
    ? "EDITOR’S CHOICE"
    : moodOne
      ? moodOne.toUpperCase()
      : "PAIRING";
  return (
    <a key={r.id} className="pairing" href={`/pairings/${r.id}`}>
      <div className="pairing-left">
        <span className="pairing-no">
          PAIRING {formatArchive(r.archive_number)} · {corner}
        </span>
        <h3 className="pairing-title">
          {pen?.model ?? "—"} <em>×</em>
          <br />
          {paper?.model ?? "—"}
        </h3>
        {editorial["headline"] || editorial["deck"] ? (
          <p className="pairing-x">{String(editorial["headline"] ?? editorial["deck"])}</p>
        ) : null}
        {editorial["tastingNote"] ? (
          <div className="pairing-notes">
            <p>{String(editorial["tastingNote"])}</p>
          </div>
        ) : null}
      </div>
      <div className="pairing-right">
        <div className="pairing-score">
          <div className="score-cell">
            <span className="k">Affinity</span>
            <div className="v">{r.affinity_score}</div>
          </div>
        </div>
      </div>
    </a>
  );
}

const RENDERERS: Record<Kind, (r: Row) => ReactNode> = {
  pen: renderPen,
  paper: renderPaper,
  ink: renderInk,
  pairing: renderPairing,
};

const GRID_CLASS: Record<Kind, string> = {
  pen: "archive-grid",
  paper: "archive-grid",
  ink: "ink-archive",
  pairing: "pairings",
};

// ─── filter logic ──────────────────────────────────────────────────────

type FacetState = Record<string, Set<string>>;

function filterRows(rows: Row[], facets: FacetDef[], state: FacetState, query: string): Row[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    for (const f of facets) {
      const selected = state[f.key];
      if (!selected || selected.size === 0) continue;
      const values = f.getValues(row);
      if (!values.some((v) => selected.has(v))) return false;
    }
    if (q) {
      const blob = [row.brand, row.model, row.country_of_origin, row.mill, row.family, row.hue_family]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });
}

// ─── component ─────────────────────────────────────────────────────────

export function FilterableArchive({
  kind,
  rows,
  searchPlaceholder,
}: {
  kind: Kind;
  rows: Row[];
  searchPlaceholder?: string;
}) {
  const facets = FACETS_BY_KIND[kind];
  const renderCard = RENDERERS[kind];
  const gridClassName = GRID_CLASS[kind];
  const [state, setState] = useState<FacetState>({});
  const [query, setQuery] = useState<string>("");

  const filtered = useMemo(
    () => filterRows(rows, facets, state, query),
    [rows, facets, state, query],
  );

  function countsForFacet(f: FacetDef): Map<string, number> {
    const otherFacets = facets.filter((x) => x.key !== f.key);
    const partial = filterRows(rows, otherFacets, state, query);
    const counts = new Map<string, number>();
    for (const row of partial) {
      for (const v of f.getValues(row)) {
        if (!v) continue;
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    }
    return counts;
  }

  function toggleChip(facetKey: string, value: string) {
    setState((s) => {
      const next = new Set(s[facetKey] ?? []);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...s, [facetKey]: next };
    });
  }

  const activeChipCount = Object.values(state).reduce((n, set) => n + set.size, 0);

  return (
    <>
      <div className="filterbar">
        {searchPlaceholder ? (
          <div className="fb-search">
            <svg
              className="fb-icon"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.2}
            >
              <circle cx="7" cy="7" r="5" />
              <line x1="11" y1="11" x2="14" y2="14" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        ) : null}
        {facets.map((f) => {
          const counts = countsForFacet(f);
          const selected = state[f.key] ?? new Set<string>();
          const knownOrder = f.order ?? [];
          const known = knownOrder.filter((v) => counts.has(v) || selected.has(v));
          const extras = Array.from(counts.keys())
            .filter((v) => !knownOrder.includes(v))
            .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
          const chipValues = [...known, ...extras];
          if (chipValues.length === 0) return null;
          return (
            <div className="fb-cell" key={f.key}>
              <span className="k">{f.label}</span>
              <div className="chips">
                {chipValues.map((v) => {
                  const n = counts.get(v) ?? 0;
                  const isOn = selected.has(v);
                  return (
                    <button
                      key={v}
                      type="button"
                      className={isOn ? "chip on" : "chip"}
                      onClick={() => toggleChip(f.key, v)}
                      style={{ appearance: "none" }}
                    >
                      {v}
                      {n > 0 ? <span className="x">×{n}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {activeChipCount > 0 ? (
          <button
            type="button"
            className="fb-clear"
            onClick={() => {
              setState({});
              setQuery("");
            }}
            style={{
              appearance: "none",
              background: "transparent",
              border: 0,
              padding: 0,
              marginLeft: "auto",
              cursor: "pointer",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "oklch(35% 0.13 25)",
            }}
          >
            Clear all ×
          </button>
        ) : null}
      </div>

      <div className={gridClassName}>
        {filtered.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "32px 24px",
              fontFamily: "var(--font-display, serif)",
              fontStyle: "italic",
              color: "oklch(40% 0.02 80 / 0.65)",
              textAlign: "center",
            }}
          >
            No specimens match the current filters.
          </div>
        ) : (
          filtered.map((row) => renderCard(row))
        )}
      </div>
    </>
  );
}
