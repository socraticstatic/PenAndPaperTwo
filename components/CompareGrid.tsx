"use client";

import { useEffect, useState } from "react";
import { useCompareItems, type CompareItem } from "@/lib/client/compare";

// Side-by-side attribute grid. Fetches each compared entity's full row
// from Supabase (client-side via REST), renders rows for the union of
// relevant attributes, and tints rows where every visible value agrees.

type EntityRow = {
  id: string;
  brand: string;
  model: string;
  variant?: string | null;
  archive_number: number;
  country_of_origin: string;
  year_introduced?: number | null;
  // JSONB columns — accessed dynamically per kind.
  nib?: Record<string, unknown>;
  ink_delivery?: Record<string, unknown>;
  body?: Record<string, unknown>;
  dimensions?: Record<string, unknown>;
  performance?: Record<string, unknown>;
  pricing?: Record<string, unknown>;
  substance?: Record<string, unknown>;
  surface?: Record<string, unknown>;
  appearance?: Record<string, unknown>;
  format?: Record<string, unknown>;
  color?: Record<string, unknown>;
  chemistry?: Record<string, unknown>;
  family?: string;
  hue_family?: string;
};

type FetchedItem = CompareItem & { row: EntityRow | null };

type RowSpec = {
  label: string;
  get: (it: FetchedItem) => string | number | null | undefined;
};

const TABLE_BY_KIND: Record<CompareItem["kind"], string> = {
  pen: "pens",
  paper: "papers",
  ink: "inks",
};

async function fetchOne(item: CompareItem): Promise<FetchedItem> {
  const cfg = (window as unknown as { ppSupabaseConfig?: { url?: string; anonKey?: string } })
    .ppSupabaseConfig;
  if (!cfg?.url || !cfg?.anonKey) return { ...item, row: null };
  const table = TABLE_BY_KIND[item.kind];
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/${table}?id=eq.${encodeURIComponent(item.id)}&select=*`,
      {
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) return { ...item, row: null };
    const json = (await res.json()) as EntityRow[];
    return { ...item, row: json[0] ?? null };
  } catch {
    return { ...item, row: null };
  }
}

// Per-kind row specs. Each row pulls a value or returns null for "—".
function rowsForPens(): RowSpec[] {
  return [
    { label: "Nib material", get: (it) => str(it.row?.nib?.["material"]) },
    { label: "Nib size", get: (it) => str(it.row?.nib?.["size"]) },
    { label: "Flex", get: (it) => str(it.row?.nib?.["flex"]) },
    {
      label: "Filler",
      get: (it) => str(it.row?.ink_delivery?.["fillingSystem"]),
    },
    { label: "Flow", get: (it) => str(it.row?.ink_delivery?.["flow"]) },
    { label: "Body material", get: (it) => str(it.row?.body?.["material"]) },
    { label: "Trim", get: (it) => str(it.row?.body?.["trimColor"]) },
    {
      label: "Length, capped",
      get: (it) =>
        num(it.row?.dimensions?.["lengthCappedMm"], "mm"),
    },
    {
      label: "Weight, capped",
      get: (it) => num(it.row?.dimensions?.["weightCappedG"], "g"),
    },
    {
      label: "Smoothness",
      get: (it) => num(it.row?.performance?.["smoothness"], "/10"),
    },
    {
      label: "Wetness",
      get: (it) => num(it.row?.performance?.["wetnessScore"], "/100"),
    },
    {
      label: "Tier",
      get: (it) =>
        it.row?.pricing?.["priceTier"]
          ? `Tier ${String(it.row?.pricing?.["priceTier"])}`
          : null,
    },
    { label: "Country", get: (it) => it.row?.country_of_origin ?? null },
    { label: "Year introduced", get: (it) => it.row?.year_introduced ?? null },
  ];
}

function rowsForPapers(): RowSpec[] {
  return [
    { label: "GSM", get: (it) => num(it.row?.substance?.["gsm"], "gsm") },
    {
      label: "Caliper",
      get: (it) => num(it.row?.substance?.["caliperUm"], "µm"),
    },
    {
      label: "Pulp source",
      get: (it) => str(it.row?.substance?.["pulpSource"]),
    },
    {
      label: "Cotton",
      get: (it) => num(it.row?.substance?.["cottonPct"], "%"),
    },
    { label: "Tooth", get: (it) => str(it.row?.surface?.["tooth"]) },
    { label: "Sizing", get: (it) => str(it.row?.surface?.["sizing"]) },
    {
      label: "Sheen visibility",
      get: (it) => num(it.row?.performance?.["sheenVisibility"], "/5"),
    },
    {
      label: "Feathering",
      get: (it) =>
        num(it.row?.performance?.["featheringTendency"], "/5"),
    },
    { label: "Tone", get: (it) => str(it.row?.appearance?.["tone"]) },
    { label: "Format", get: (it) => str(it.row?.format?.["kind"]) },
    { label: "Country", get: (it) => it.row?.country_of_origin ?? null },
  ];
}

function rowsForInks(): RowSpec[] {
  return [
    { label: "Family", get: (it) => it.row?.family ?? null },
    { label: "Hue family", get: (it) => it.row?.hue_family ?? null },
    {
      label: "Wetness",
      get: (it) => num(it.row?.performance?.["wetness"], "/100"),
    },
    {
      label: "Saturation",
      get: (it) => num(it.row?.performance?.["saturation"], "/100"),
    },
    {
      label: "Sheen",
      get: (it) => num(it.row?.performance?.["sheenVisibility"], "/5"),
    },
    {
      label: "Shimmer",
      get: (it) => num(it.row?.performance?.["shimmerVisibility"], "/5"),
    },
    {
      label: "Dry time (M)",
      get: (it) => {
        const v = (
          it.row?.performance?.["dryTimeByNib"] as
            | Record<string, number>
            | undefined
        )?.["M"];
        return v != null ? `${v} s` : null;
      },
    },
    {
      label: "Water-resistant",
      get: (it) => str(it.row?.chemistry?.["waterResistant"]),
    },
    { label: "Country", get: (it) => it.row?.country_of_origin ?? null },
  ];
}

function rowsMixed(): RowSpec[] {
  return [
    { label: "Brand", get: (it) => it.row?.brand ?? null },
    { label: "Model", get: (it) => it.row?.model ?? null },
    { label: "Variant", get: (it) => it.row?.variant ?? null },
    { label: "Archive №", get: (it) => it.row?.archive_number ?? null },
    { label: "Country", get: (it) => it.row?.country_of_origin ?? null },
    { label: "Year", get: (it) => it.row?.year_introduced ?? null },
  ];
}

function str(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  return String(v);
}
function num(v: unknown, suffix = ""): string | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return `${n}${suffix}`;
}

function allValuesAgree(values: Array<string | number | null | undefined>): boolean {
  const populated = values.filter((v) => v != null && v !== "");
  if (populated.length < 2) return false;
  const first = String(populated[0]);
  return populated.every((v) => String(v) === first);
}

export function CompareGrid() {
  const items = useCompareItems();
  const [fetched, setFetched] = useState<FetchedItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out = await Promise.all(items.map(fetchOne));
      if (!cancelled) setFetched(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (!items.length) {
    return (
      <div className="compare-grid">
        <div
          className="cmp-row"
          style={{
            gridTemplateColumns: "1fr",
            padding: "32px",
            color: "oklch(40% 0.02 80 / 0.65)",
            fontFamily: "var(--font-display, serif)",
            fontStyle: "italic",
          }}
        >
          The compare drawer is empty. Add specimens from any pen, paper, or ink page.
        </div>
      </div>
    );
  }

  const allSameKind = items.every((it) => it.kind === items[0].kind);
  const rows: RowSpec[] = allSameKind
    ? items[0].kind === "pen"
      ? rowsForPens()
      : items[0].kind === "paper"
        ? rowsForPapers()
        : rowsForInks()
    : rowsMixed();

  return (
    <div
      className="compare-grid"
      style={{
        gridTemplateColumns: `200px repeat(${items.length}, 1fr)`,
      }}
    >
      {/* Header row */}
      <div className="cmp-row" style={{ gridTemplateColumns: `200px repeat(${items.length}, 1fr)` }}>
        <div className="cmp-cell label" style={{ background: "var(--paper)" }}>
          <span className="mono">Specimen</span>
        </div>
        {fetched.map((it) => (
          <div
            className="cmp-cell header"
            key={`hd-${it.id}`}
            style={{ color: it.silhouetteColor ?? "oklch(28% 0.04 80)" }}
          >
            <span
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "oklch(40% 0.02 80 / 0.55)",
              }}
            >
              {it.kind.toUpperCase()}
            </span>
            <span className="cbrand">
              {it.row?.brand ?? it.brand}
              {it.row?.country_of_origin ? ` · ${it.row.country_of_origin}` : ""}
            </span>
            <span className="cname">{it.row?.model ?? it.model}</span>
          </div>
        ))}
      </div>

      {/* Attribute rows */}
      {rows.map((rs) => {
        const values = fetched.map((it) => rs.get(it));
        const match = allValuesAgree(values);
        return (
          <div
            className={match ? "cmp-row match" : "cmp-row"}
            style={{
              gridTemplateColumns: `200px repeat(${items.length}, 1fr)`,
            }}
            key={rs.label}
          >
            <div className="cmp-cell label first">{rs.label}</div>
            {values.map((v, i) => (
              <div className="cmp-cell" key={`${rs.label}-${i}`}>
                <span className="cmp-value">{v != null && v !== "" ? String(v) : "—"}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
