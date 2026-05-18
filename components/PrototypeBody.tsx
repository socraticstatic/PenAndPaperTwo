import parse from "html-react-parser";
import { InlineScripts } from "./InlineScripts";
import type { PrototypePage } from "@/lib/prototype";

export function PrototypeBody({ page }: { page: PrototypePage }) {
  return (
    <>
      {page.headStyles.map((css, i) => (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: css }}
          // The styles are static per page; index is a stable key here.
          // eslint-disable-next-line react/no-array-index-key
          key={i}
        />
      ))}
      {parse(page.bodyHtml)}
      <InlineScripts scripts={page.inlineScripts} />
    </>
  );
}
