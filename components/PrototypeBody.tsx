import parse, {
  type DOMNode,
  type HTMLReactParserOptions,
  Element,
} from "html-react-parser";
import { InlineScripts } from "./InlineScripts";
import type { PrototypePage } from "@/lib/prototype";

const parserOptions: HTMLReactParserOptions = {
  replace: (node: DOMNode) => {
    // html-react-parser renders custom elements (e.g. <image-slot>) fine,
    // but it emits unknown boolean attrs as strings — let the defaults pass.
    if (node instanceof Element) {
      // No-op: kept here as the obvious extension point if we need to swap
      // <image-slot> for next/image once images move into Supabase Storage.
    }
    return undefined;
  },
};

export function PrototypeBody({ page }: { page: PrototypePage }) {
  return (
    <>
      {parse(page.bodyHtml, parserOptions)}
      <InlineScripts scripts={page.inlineScripts} />
    </>
  );
}
