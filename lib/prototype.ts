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
  headStyles: string[];
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

  // Per-page <style> blocks live in <head>. Extract them so they can be
  // injected into the layout — without these the prototype's per-page
  // layout rules (breadcrumb, pp-card, .meas-table etc.) are missing.
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headStyles: string[] = [];
  if (headMatch) {
    const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
    let m: RegExpExecArray | null;
    while ((m = styleRe.exec(headMatch[1])) !== null) {
      headStyles.push(m[1]);
    }
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) throw new Error(`No <body> in ${htmlFile}`);
  let bodyHtml = bodyMatch[1];

  // Extract inline scripts. React 19 SSRs `<script>` content but doesn't
  // execute it on initial load, so we strip the inline blocks out of the
  // markup and run them client-side via the InlineScripts component, which
  // appends fresh <script> nodes via JS (those DO execute).
  // Each block is IIFE-wrapped so dev-mode StrictMode double-mounts can't
  // re-declare top-level `const pickerWords = …` etc.
  const inlineScripts: string[] = [];
  bodyHtml = bodyHtml.replace(
    /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi,
    (_m, code: string) => {
      const trimmed = code.trim();
      if (trimmed) inlineScripts.push(`(function(){\n${trimmed}\n})();`);
      return "";
    },
  );

  // Strip external script tags — the layout loads them once globally
  // (image-slot.js, React UMD, Babel, tweaks-*.jsx, search.js).
  bodyHtml = bodyHtml.replace(/<script[^>]*\bsrc=[^>]*><\/script>/gi, "");

  // Prototype defect: `pairing.html` puts an inner `<a href="…">→</a>`
  // inside an outer `<a class="pp-card">…</a>` card — invalid nesting that
  // browsers auto-fix but React 19 SSR flags as a hydration error. The
  // outer card already routes to the same target, so the inner anchor is
  // redundant; collapse it to a span.
  bodyHtml = bodyHtml.replace(
    /<a\s+href="[^"]*"[^>]*>(\s*[→↦›»])\s*<\/a>/g,
    "<span>$1</span>",
  );

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

  return { bodyHtml, inlineScripts, headStyles, title };
}
