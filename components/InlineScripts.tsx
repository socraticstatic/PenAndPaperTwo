"use client";

import { useEffect, useRef } from "react";

/**
 * Executes each prototype page's inline `<script>` blocks after React has
 * placed the parsed markup in the DOM.
 *
 * React 19 SSRs the contents of `<script>` elements but does NOT execute
 * them on initial load — so we strip the inline blocks in `lib/prototype.ts`
 * and materialise fresh `<script>` nodes here. Scripts appended to the DOM
 * via JS DO execute in the browser.
 *
 * Re-entrancy: React StrictMode runs effects twice in dev. The captured
 * scripts are IIFE-wrapped so re-execution can't re-declare top-level
 * `const`. A useRef gate keeps each instance from doubling up listeners
 * on a second StrictMode pass. We don't remove the appended `<script>`
 * nodes in cleanup — they're inert once run, and the event listeners they
 * registered live on the prototype DOM nodes (not on the script tag).
 */
export function InlineScripts({ scripts }: { scripts: string[] }) {
  const ranRef = useRef(false);
  useEffect(() => {
    if (ranRef.current) return;
    if (!scripts.length) return;
    ranRef.current = true;
    for (const code of scripts) {
      const s = document.createElement("script");
      s.textContent = code;
      document.body.appendChild(s);
    }
  }, [scripts]);
  return null;
}
