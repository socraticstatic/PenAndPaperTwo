import {
  type DOMNode,
  type HTMLReactParserOptions,
  Element,
} from "html-react-parser";
import type { InkRow } from "@/lib/supabase/inks";
import { InkCupboardSection } from "./archive-sections";
import { copy, type CopyMap } from "@/lib/supabase/page-copy";

// Replace the prototype's static ink archive section with a filterable
// one driven by DB rows. The section-head copy is read from page_copy
// so it stays author-editable.
//
// The prototype wraps everything in `<section class="section ink-cupboard">`
// (no id). We target the .ink-archive grid's enclosing section by finding
// the first <section> with a <div class="ink-archive"> child.

export function buildInkArchiveReplace(
  inks: InkRow[],
  pageCopy: CopyMap,
): HTMLReactParserOptions["replace"] {
  let alreadyRendered = false;
  function inkArchiveReplace(node: DOMNode) {
    if (!(node instanceof Element)) return undefined;

    // Target the section that contains the ink-archive grid — render it
    // once and skip the prototype's filter chips + grid.
    if (
      node.name === "section" &&
      !alreadyRendered &&
      hasInkArchiveChild(node)
    ) {
      alreadyRendered = true;
      return (
        <InkCupboardSection
          rows={inks}
          sectionNo={copy(pageCopy, "ink.cupboard.section_no") || "№ 01 · The Cupboard"}
          titleTemplate={
            copy(pageCopy, "ink.cupboard.title") || "The Ink cupboard."
          }
          kicker={
            copy(pageCopy, "ink.cupboard.kicker") ||
            "Sheen, shimmer, family, hue — filter by what the bottle is for."
          }
        />
      );
    }

    // If we already rendered the cupboard, drop any subsequent ink-archive
    // div (otherwise the prototype's static grid would render after ours).
    if (
      node.name === "div" &&
      (node.attribs.class ?? "").split(/\s+/).includes("ink-archive")
    ) {
      return <></>;
    }

    return undefined;
  }
  return inkArchiveReplace;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasInkArchiveChild(node: Element): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function walk(n: any): boolean {
    if (!n) return false;
    if (
      n instanceof Element &&
      n.name === "div" &&
      (n.attribs.class ?? "").split(/\s+/).includes("ink-archive")
    ) {
      return true;
    }
    if (n.children) {
      for (const c of n.children) {
        if (walk(c)) return true;
      }
    }
    return false;
  }
  return walk(node);
}
