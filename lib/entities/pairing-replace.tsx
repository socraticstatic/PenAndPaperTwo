import {
  type DOMNode,
  type HTMLReactParserOptions,
  Element,
} from "html-react-parser";
import type { PairingWithSides } from "@/lib/supabase/pairings";
import type { Editorial } from "@/lib/supabase/jsonb-shapes";
import { formatArchive, hasClass } from "./format";

export function buildPairingReplace(
  pr: PairingWithSides,
): HTMLReactParserOptions["replace"] {
  const editorial = (pr.editorial ?? {}) as Editorial;
  const pen = pr.pen;
  const paper = pr.paper;
  const moodOne = pr.mood?.[0] ?? "";

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

    return undefined;
  }

  return pairingReplace;
}
