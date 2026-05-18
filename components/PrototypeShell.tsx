import parse, { type HTMLReactParserOptions } from "html-react-parser";
import { InlineScripts } from "./InlineScripts";
import { loadPrototypePage } from "@/lib/prototype";

type PrototypeShellProps = {
  // File under /public/prototype/ (e.g. "pen.html", "index.html")
  prototypeFile: string;
  // Optional html-react-parser replace hook that swaps prototype
  // elements with DB-bound JSX. Omit for pages that render the
  // prototype HTML unchanged.
  replace?: HTMLReactParserOptions["replace"];
};

// Renders one prototype page through the project's standard pipeline:
//   1. Pull <style> blocks out of the prototype's <head>
//   2. Parse the <body> through html-react-parser (with optional replace)
//   3. Re-execute the inline <script> blocks the body carries
//
// This is the single rendering shell for every prototype-backed page.
// Detail routes that fetch a DB row pass a buildReplace(row) result;
// prototype-only pages (today: / and /ink) pass no replace.
//
// Replaced the earlier PrototypeBody (no-replace) and EntityDetailPage
// (with-replace) which did the same work twice.
export async function PrototypeShell({
  prototypeFile,
  replace,
}: PrototypeShellProps) {
  const page = await loadPrototypePage(prototypeFile);
  return (
    <>
      {page.headStyles.map((css, i) => (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: css }}
          // eslint-disable-next-line react/no-array-index-key
          key={i}
        />
      ))}
      {parse(page.bodyHtml, replace ? { replace } : undefined)}
      <InlineScripts scripts={page.inlineScripts} />
    </>
  );
}
