import { type Element } from "html-react-parser";

// Helpers reused across every entity's `buildReplace` function.

export function hasClass(node: Element, name: string): boolean {
  return !!node.attribs.class?.split(/\s+/).includes(name);
}

export function formatArchive(n: number): string {
  return `№ ${String(n).padStart(3, "0")}`;
}

// "Amber Demonstrator" → { italic: "Amber", rest: "Demonstrator" }
// Used for the three-line H1 layout the prototype's detail pages use:
//   <model>\n<em>{italic}</em>\n<rest>
export function splitVariant(variant: string | null | undefined): {
  italic: string;
  rest: string;
} {
  if (!variant) return { italic: "", rest: "" };
  const parts = variant.split(/\s+/);
  return { italic: parts[0] ?? "", rest: parts.slice(1).join(" ") };
}
