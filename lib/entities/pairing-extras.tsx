import type { PairingWithSides } from "@/lib/supabase/pairings";
import type {
  Editorial,
  PairingConditions,
  PairingMeasurements,
  PairingScoring,
} from "@/lib/supabase/jsonb-shapes";

// 5-axis breakdown grid. Each axis: numeral, name (with × glyph), score
// N/100, bar at N%, and an editorial body paragraph if seeded in
// editorial.axesBodies[axisKey]. Body falls back silently if missing.
export function AxesGrid({ pr }: { pr: PairingWithSides }) {
  const s = (pr.scoring ?? {}) as PairingScoring;
  const editorial = (pr.editorial ?? {}) as Editorial & {
    axesBodies?: Record<string, string>;
  };
  const bodies = editorial.axesBodies ?? {};

  const axes: Array<{
    num: string;
    nameStart: string;
    nameEnd: string;
    score: number | undefined;
    body: string | undefined;
  }> = [
    {
      num: "i.",
      nameStart: "Wetness ",
      nameEnd: " Absorbency",
      score: s.wetnessAbsorbency,
      body: bodies.wetnessAbsorbency,
    },
    {
      num: "ii.",
      nameStart: "Nib Size ",
      nameEnd: " Tooth",
      score: s.nibSizeTooth,
      body: bodies.nibSizeTooth,
    },
    {
      num: "iii.",
      nameStart: "Sheen ",
      nameEnd: " Smoothness",
      score: s.sheenSmoothness,
      body: bodies.sheenSmoothness,
    },
    {
      num: "iv.",
      nameStart: "Flex ",
      nameEnd: " Sizing",
      score: s.flexSizing,
      body: bodies.flexSizing,
    },
    {
      num: "v.",
      nameStart: "Use ",
      nameEnd: " Mood",
      score: s.useMood,
      body: bodies.useMood,
    },
  ];

  return (
    <div className="axes-grid">
      {axes
        .filter((a) => a.score != null)
        .map((a) => (
          <div className="ax-card" key={a.num}>
            <span className="ax-no">{a.num}</span>
            <h3 className="ax-name">
              {a.nameStart}
              <em>×</em>
              {a.nameEnd}
            </h3>
            {a.body ? <p className="ax-body">{a.body}</p> : null}
            <div className="ax-score">
              {a.score}
              <span className="denom">/100</span>
            </div>
            <div className="ax-bar">
              <i style={{ left: `${a.score}%` }}></i>
            </div>
          </div>
        ))}
    </div>
  );
}

// The prototype renders two <table class="meas-table">s in order:
// first is Measurements, second is Conditions. We distinguish via a
// counter closure in buildPairingReplace.

type Row = {
  label: string;
  value: string | number | null | undefined;
  note?: string | null;
};

function MeasTable({ rows }: { rows: Row[] }) {
  const visible = rows.filter(
    (r) => r.value !== null && r.value !== undefined && r.value !== "",
  );
  if (!visible.length) return null;
  return (
    <table className="meas-table">
      <tbody>
        {visible.map((r) => (
          <tr key={r.label}>
            <td>{r.label}</td>
            <td>{String(r.value)}</td>
            <td>{r.note ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function MeasurementsTable({ pr }: { pr: PairingWithSides }) {
  const m = (pr.measurements ?? {}) as PairingMeasurements;
  return (
    <MeasTable
      rows={[
        {
          label: "Dry time",
          value: m.dryTimeSec ? `${m.dryTimeSec} seconds` : null,
          note: m.inkUsed ? `${m.inkUsed} · M nib` : null,
        },
        {
          label: "Bleed-through",
          value: m.bleed,
          note: m.bleed === "None" ? "Verso · clean" : null,
        },
        {
          label: "Ghosting",
          value: m.ghosting,
          note: null,
        },
        {
          label: "Feathering",
          value: m.feathering,
          note: m.feathering === "Nil" ? "10× loupe · sharp" : null,
        },
        {
          label: "Show-through",
          value: m.showThrough,
          note: null,
        },
        {
          label: "Sheen observed",
          value: m.sheenObserved,
          note: null,
        },
        {
          label: "Shading",
          value: m.shading,
          note: null,
        },
        {
          label: "Line crispness",
          value: m.lineCrispness,
          note: m.lineCrispness === "9/10" ? "No spread observed" : null,
        },
      ]}
    />
  );
}

export function ConditionsTable({ pr }: { pr: PairingWithSides }) {
  const c = (pr.conditions ?? {}) as PairingConditions;
  const m = (pr.measurements ?? {}) as PairingMeasurements;
  return (
    <MeasTable
      rows={[
        { label: "Ink", value: m.inkUsed, note: "—" },
        { label: "Hour", value: c.hour, note: "Still" },
        {
          label: "Lighting",
          value: c.lightingK ? `${c.lightingK} K` : null,
          note: "Desk lamp",
        },
        {
          label: "Temperature",
          value: c.tempC ? `${c.tempC} °C` : null,
          note: "Indoor",
        },
        {
          label: "Humidity",
          value: c.rhPct ? `${c.rhPct} % RH` : null,
          note: null,
        },
        {
          label: "Angle",
          value: c.angleDeg ? `${c.angleDeg}°` : null,
          note: "Sheen-visible",
        },
        { label: "Hand", value: c.hand, note: null },
      ]}
    />
  );
}
