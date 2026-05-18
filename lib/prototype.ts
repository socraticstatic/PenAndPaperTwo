import fs from "node:fs/promises";
import path from "node:path";

const PAGE_LINK_REWRITES: Array<[RegExp, string]> = [
  [/href="index\.html"/g, 'href="/"'],
  [/href="pen\.html"/g, 'href="/pen"'],
  [/href="paper\.html"/g, 'href="/paper"'],
  [/href="pairing\.html"/g, 'href="/pairing"'],
  [/href="ink-detail\.html"/g, 'href="/ink-detail"'],
  [/href="ink\.html"/g, 'href="/ink"'],
];

export type PrototypePage = {
  bodyHtml: string;
  inlineScripts: string[];
  title: string;
};

export async function loadPrototypePage(
  htmlFile: string,
): Promise<PrototypePage> {
  const fullPath = path.join(process.cwd(), "public", "prototype", htmlFile);
  const html = await fs.readFile(fullPath, "utf8");

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? titleMatch[1]
        .replace(/&amp;/g, "&")
        .replace(/&mdash;/g, "—")
        .trim()
    : "Pen & Paper";

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) throw new Error(`No <body> in ${htmlFile}`);
  let bodyHtml = bodyMatch[1];

  // Strip and capture inline scripts so we can re-run them after hydration.
  const inlineScripts: string[] = [];
  bodyHtml = bodyHtml.replace(
    /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi,
    (_m, code) => {
      const trimmed = String(code).trim();
      if (trimmed) inlineScripts.push(trimmed);
      return "";
    },
  );

  // Strip external script tags — the layout loads them once globally
  // (image-slot.js, React UMD, Babel, tweaks-*.jsx, search.js).
  bodyHtml = bodyHtml.replace(/<script[^>]*\bsrc=[^>]*><\/script>/gi, "");

  // Rewrite cross-page links to Next.js routes.
  for (const [pattern, replacement] of PAGE_LINK_REWRITES) {
    bodyHtml = bodyHtml.replace(pattern, replacement);
  }

  // React 19 SSR doesn't auto-insert <tbody> the way browsers do, so a
  // prototype `<table><tr>...</tr></table>` produces a hydration mismatch.
  // Wrap rows in <tbody> ourselves. Prototype tables don't nest.
  bodyHtml = bodyHtml.replace(
    /(<table\b[^>]*>)([\s\S]*?)(<\/table>)/g,
    (match, open: string, inner: string, close: string) => {
      if (/<tbody|<thead|<tfoot/i.test(inner)) return match;
      return `${open}<tbody>${inner}</tbody>${close}`;
    },
  );

  return { bodyHtml, inlineScripts, title };
}
