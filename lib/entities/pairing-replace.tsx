import {
  type DOMNode,
  type HTMLReactParserOptions,
  Element,
} from "html-react-parser";
import type { PairingWithSides } from "@/lib/supabase/pairings";
import type { Editorial } from "@/lib/supabase/jsonb-shapes";
import { formatArchive, hasClass } from "./format";
import {
  AxesGrid,
  ConditionsTable,
  MeasurementsTable,
} from "./pairing-extras";

export function buildPairingReplace(
  pr: PairingWithSides,
): HTMLReactParserOptions["replace"] {
  const editorial = (pr.editorial ?? {}) as Editorial;
  const pen = pr.pen;
  const paper = pr.paper;
  const moodOne = pr.mood?.[0] ?? "";

  // The prototype renders two `<table class="meas-table">`s in
  // document order — first is Measurements, second is Conditions.
  // Track which one we're on via a counter in this closure.
  let measTableSeen = 0;

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
      const useMood = moodOne ? `${pr.use_case} · ${moodOne}` : pr.use_case;
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

    // 5-axis breakdown grid below the hero
    if (node.name === "div" && hasClass(node, "axes-grid")) {
      return <AxesGrid pr={pr} />;
    }

    // The two meas-table elements — first is measurements, second is conditions
    if (node.name === "table" && hasClass(node, "meas-table")) {
      measTableSeen += 1;
      if (measTableSeen === 1) return <MeasurementsTable pr={pr} />;
      if (measTableSeen === 2) return <ConditionsTable pr={pr} />;
    }

    return undefined;
  }

  return pairingReplace;
}
