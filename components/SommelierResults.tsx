"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Reads the 5 picker sliders' live values from the DOM (the prototype's
// inline script handles the label-word updates; we just observe the
// values), debounces, and calls public.pair_match_by_axes via Supabase
// REST. Renders the top results into the picker-results aside.
//
// Replaces the prototype's hard-coded 3 sample results.

type PickerResult = {
  pen_id: string;
  pen_brand: string;
  pen_model: string;
  paper_id: string;
  paper_brand: string;
  paper_model: string;
  overall: number;
  axes: {
    wetnessAbsorbency: number;
    nibSizeTooth: number;
    sheenSmoothness: number;
    flexSizing: number;
    useMood: number;
  };
  distance: number;
};

type Axes = {
  wet: number;
  tooth: number;
  sheen: number;
  heritage: number;
  occasion: number;
};

const ROMAN = ["i.", "ii.", "iii.", "iv.", "v.", "vi."];

function readAxes(): Axes {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(".picker input[type=range][data-axis]"),
  );
  const out: Record<string, number> = { wet: 50, tooth: 50, sheen: 50, heritage: 50, occasion: 50 };
  for (const i of inputs) {
    const axis = i.dataset.axis;
    if (axis) out[axis] = Number(i.value) || 50;
  }
  return out as Axes;
}

async function callPicker(axes: Axes): Promise<PickerResult[]> {
  const cfg = (window as unknown as { ppSupabaseConfig?: { url?: string; anonKey?: string } })
    .ppSupabaseConfig;
  if (!cfg?.url || !cfg?.anonKey) return [];
  try {
    const res = await fetch(`${cfg.url}/rest/v1/rpc/pair_match_by_axes`, {
      method: "POST",
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        target_wet: axes.wet,
        target_tooth: axes.tooth,
        target_sheen: axes.sheen,
        target_heritage: axes.heritage,
        target_occasion: axes.occasion,
        lim: 5,
      }),
    });
    if (!res.ok) return [];
    return (await res.json()) as PickerResult[];
  } catch {
    return [];
  }
}

export function SommelierResults() {
  const [results, setResults] = useState<PickerResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;
    let inFlight = 0;

    async function refresh() {
      const myToken = ++inFlight;
      setLoading(true);
      const axes = readAxes();
      const rows = await callPicker(axes);
      if (cancelled || myToken !== inFlight) return;
      setResults(rows);
      setLoading(false);
    }

    function onInput(e: Event) {
      const t = e.target as HTMLElement | null;
      if (!t || !t.matches(".picker input[type=range]")) return;
      if (timer != null) window.clearTimeout(timer);
      timer = window.setTimeout(refresh, 220);
    }

    // Initial population: wait for the prototype's inline script to
    // populate the sliders' default values (it runs on hydration).
    timer = window.setTimeout(refresh, 400);
    document.addEventListener("input", onInput);

    return () => {
      cancelled = true;
      document.removeEventListener("input", onInput);
      if (timer != null) window.clearTimeout(timer);
    };
  }, []);

  return (
    <aside className="picker-results">
      <div className="picker-results-head">
        <span className="pr-eyebrow">Matches</span>
        <div className="pr-count">
          <em data-out="count">{results.length || "—"}</em> marriages match
        </div>
        <span className="pr-meta">
          {loading ? "Computing…" : "Engine-ranked, by attribute distance"}
        </span>
      </div>

      {results.length === 0 && !loading ? (
        <div
          style={{
            padding: "24px 4px",
            color: "oklch(40% 0.02 80 / 0.55)",
            fontStyle: "italic",
            fontFamily: "var(--font-display, serif)",
          }}
        >
          Move a slider — the engine will rank pairings live.
        </div>
      ) : null}

      {results.map((r, i) => (
        <a
          key={`${r.pen_id}-${r.paper_id}`}
          href={`/pens/${r.pen_id}`}
          className="picker-result"
          style={{ display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 12, alignItems: "center" }}
        >
          <span className="pr-rank">{ROMAN[i] ?? `${i + 1}.`}</span>
          <div>
            <div className="pr-title">
              {r.pen_model} <em>×</em> {r.paper_model}
            </div>
            <div className="pr-sub">
              {r.pen_brand} · {r.paper_brand}
            </div>
          </div>
          <div className="pr-score">
            <span className="lbl">Affinity</span>
            {r.overall}
          </div>
        </a>
      ))}

      {results.length > 0 ? (
        <div className="picker-foot">
          <span>{results.length} of {results.length} shown</span>
          <span>
            <Link href="/#pairings" style={{ textDecoration: "underline" }}>
              Browse all matches →
            </Link>
          </span>
        </div>
      ) : null}
    </aside>
  );
}
