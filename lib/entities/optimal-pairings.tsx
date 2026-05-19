import Link from "next/link";
import type {
  PaperMatchForPen,
  PenMatchForPaper,
} from "@/lib/supabase/pairings";
import { formatArchive } from "./format";

// Renders the engine's top suggestions for "best papers for this pen"
// or "best pens for this paper". Replaces the prototype's hard-coded
// "Also in the Drawer" section.

type SideRows = PaperMatchForPen | PenMatchForPaper;

function isPaperMatch(r: SideRows): r is PaperMatchForPen {
  return "paper_id" in r;
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div
      style={{
        height: 4,
        background: "oklch(40% 0.02 80 / 0.15)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, score))}%`,
          height: "100%",
          background: "oklch(35% 0.13 25)",
        }}
      />
    </div>
  );
}

function AxisGrid({
  axes,
}: {
  axes: PaperMatchForPen["axes"];
}) {
  const rows: Array<[string, number]> = [
    ["Wetness × Absorbency", axes.wetnessAbsorbency],
    ["Nib × Tooth", axes.nibSizeTooth],
    ["Flex × Sizing", axes.flexSizing],
    ["Sheen × Smoothness", axes.sheenSmoothness],
    ["Use × Mood", axes.useMood],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
      {rows.map(([label, val]) => (
        <div
          key={label}
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 30px",
            gap: 8,
            alignItems: "center",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ink-mute, oklch(40% 0.02 80 / 0.6))",
          }}
        >
          <span>{label}</span>
          <ScoreBar score={val} />
          <span style={{ textAlign: "right" }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

function MatchCard({
  rank,
  href,
  archiveNo,
  brand,
  model,
  overall,
  axes,
  warnings,
}: {
  rank: string;
  href: string;
  archiveNo: number;
  brand: string;
  model: string;
  overall: number;
  axes: PaperMatchForPen["axes"];
  warnings: string[];
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: 18,
        border: "0.5px solid oklch(40% 0.02 80 / 0.2)",
        textDecoration: "none",
        color: "inherit",
        background: "oklch(97.2% 0.008 82)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink-mute, oklch(40% 0.02 80 / 0.6))",
        }}
      >
        <span>
          {rank} · {formatArchive(archiveNo)}
        </span>
        <span style={{ color: "oklch(35% 0.13 25)" }}>Affinity {overall}/100</span>
      </div>
      <div style={{ fontFamily: "var(--font-display, serif)", fontSize: 22, lineHeight: 1.2 }}>
        {model}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 11,
          letterSpacing: "0.06em",
          color: "var(--ink-mute, oklch(40% 0.02 80 / 0.65))",
          marginTop: 2,
        }}
      >
        {brand}
      </div>
      <AxisGrid axes={axes} />
      {warnings.length > 0 ? (
        <ul
          style={{
            margin: "12px 0 0",
            padding: "8px 12px",
            listStyle: "none",
            background: "oklch(94% 0.05 70)",
            borderLeft: "2px solid oklch(40% 0.12 60)",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 10,
            letterSpacing: "0.04em",
            color: "oklch(28% 0.05 60)",
          }}
        >
          {warnings.map((w) => (
            <li key={w} style={{ padding: "2px 0" }}>
              ⚠ {w}
            </li>
          ))}
        </ul>
      ) : null}
    </Link>
  );
}

const ROMAN = ["i.", "ii.", "iii.", "iv.", "v.", "vi.", "vii.", "viii.", "ix.", "x."];

export function OptimalPairings({
  side,
  matches,
  title,
  kicker,
}: {
  side: "for-pen" | "for-paper";
  matches: SideRows[];
  title?: string;
  kicker?: string;
}) {
  if (!matches.length) {
    return (
      <section className="section" id="related">
        <div className="wrap">
          <div className="section-head">
            <span className="section-no">№ — · The Cupboard is empty</span>
            <h2 className="section-title">No partners seeded yet.</h2>
            <span className="section-kicker">
              Add at least one {side === "for-pen" ? "paper" : "pen"} row to surface optimal pairings.
            </span>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="section" id="related">
      <div className="wrap">
        <div className="section-head">
          <span className="section-no">№ — · The Engine Recommends</span>
          <h2 className="section-title">
            {title ??
              (side === "for-pen"
                ? "Top papers for this pen, by attribute."
                : "Top pens for this paper, by attribute.")}
          </h2>
          <span className="section-kicker">
            {kicker ??
              "Scored across five axes — wetness × absorbency, nib × tooth, flex × sizing, sheen × smoothness, use × mood. No editorial intervention."}
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
          }}
        >
          {matches.map((m, idx) => {
            const isPap = isPaperMatch(m);
            return (
              <MatchCard
                key={isPap ? m.paper_id : (m as PenMatchForPaper).pen_id}
                rank={ROMAN[idx] ?? `${idx + 1}.`}
                href={
                  isPap
                    ? `/papers/${m.paper_id}`
                    : `/pens/${(m as PenMatchForPaper).pen_id}`
                }
                archiveNo={
                  isPap ? m.paper_archive_no : (m as PenMatchForPaper).pen_archive_no
                }
                brand={isPap ? m.paper_brand : (m as PenMatchForPaper).pen_brand}
                model={isPap ? m.paper_model : (m as PenMatchForPaper).pen_model}
                overall={m.overall}
                axes={m.axes}
                warnings={m.warnings ?? []}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
