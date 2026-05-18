import parse, { type HTMLReactParserOptions } from "html-react-parser";
import type { ReactNode } from "react";
import { InlineScripts } from "./InlineScripts";
import { loadPrototypePage, type PrototypePage } from "@/lib/prototype";

type EntityDetailPageProps<T> = {
  // Prototype HTML file under /public/prototype/ (e.g. "pen.html")
  prototypeFile: string;
  // The DB row, or null when not found
  row: T | null;
  // Build the html-react-parser `replace` callback for this entity.
  // Called only when row is non-null.
  buildReplace: (row: T) => HTMLReactParserOptions["replace"];
  // Rendered when row is null. Use to point at the missing seed file.
  notFound: ReactNode;
};

// Wraps the four shared concerns each entity detail page needed: page-
// specific <style> blocks from the prototype's <head>, the parsed body
// with the entity's `replace` hook applied, the inline script runner,
// and a not-found fallback. Same shape as P2/P3 routes, just hoisted.
export async function EntityDetailPage<T>({
  prototypeFile,
  row,
  buildReplace,
  notFound,
}: EntityDetailPageProps<T>) {
  const page: PrototypePage = await loadPrototypePage(prototypeFile);

  if (!row) {
    return <>{notFound}</>;
  }

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
      {parse(page.bodyHtml, { replace: buildReplace(row) })}
      <InlineScripts scripts={page.inlineScripts} />
    </>
  );
}
