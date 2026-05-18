import type { PairingWithSides } from "@/lib/supabase/pairings";
import type { PairingMeasurements } from "@/lib/supabase/jsonb-shapes";

// Writing-sample cards on a pen/paper detail page. Each card shows one
// real pairing that features this entity — affinity, dry time, sheen
// — pulled from `public.pairings`. NOT faked: if the editor hasn't
// seeded any pairings for this entity, the section renders empty (and
// the caller can hide it).
//
// Renders the prototype's `<article class="sample-card">` markup
// faithfully so the existing CSS lays it out.

type Side = "pen" | "paper";

function sheenLabel(s: string | undefined): string | null {
  if (!s) return null;
  return s;
}

export function WritingSamples({
  pairings,
  side,
}: {
  pairings: PairingWithSides[];
  side: Side;
}) {
  if (!pairings.length) return <div className="samples-grid" />;
  return (
    <div className="samples-grid">
      {pairings.map((pr) => {
        // The "other side" of the pairing is what the card names —
        // a pen detail page shows papers it's been paired with, and
        // vice versa.
        const other = side === "pen" ? pr.paper : pr.pen;
        const m = (pr.measurements ?? {}) as PairingMeasurements;
        const otherTitleStart =
          (other?.model ?? "—").split(/\s+/)[0] ?? other?.model ?? "—";
        const otherTitleRest = (other?.model ?? "")
          .split(/\s+/)
          .slice(1)
          .join(" ");
        const subtitle = other
          ? `${(other as { brand?: string }).brand ?? ""}${
              side === "paper"
                ? ""
                : (other as { substance?: { gsm?: number } }).substance?.gsm
                  ? ` · ${
                      (other as { substance?: { gsm?: number } }).substance!
                        .gsm
                    } GSM`
                  : ""
            }`
          : "—";
        return (
          <article className="sample-card" key={pr.id}>
            <div className="sample-card-head">
              <span className="nm">
                {otherTitleStart}
                {otherTitleRest ? (
                  <>
                    {" "}
                    <em>{otherTitleRest}</em>
                  </>
                ) : null}
              </span>
              <span className="gsm">{subtitle.toUpperCase()}</span>
            </div>
            <div className="sample-body">
              <div className="handwrit">
                <span className="l">— {pr.use_case}.</span>
                <span className="l">{pr.mood?.[0] ?? ""}.</span>
                <span className="l">{m.inkUsed ? `Ink: ${m.inkUsed}.` : ""}</span>
              </div>
            </div>
            <div className="sample-card-foot">
              <div className="mm">
                <span className="k">Affinity</span>
                <span className="v">
                  <em>{pr.affinity_score}</em>
                </span>
              </div>
              {m.dryTimeSec ? (
                <div className="mm">
                  <span className="k">Dry time</span>
                  <span className="v">{m.dryTimeSec} s</span>
                </div>
              ) : null}
              {sheenLabel(m.sheenObserved) ? (
                <div className="mm">
                  <span className="k">Sheen</span>
                  <span className="v">{sheenLabel(m.sheenObserved)}</span>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
