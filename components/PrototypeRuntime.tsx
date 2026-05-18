"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Babel?: { transformScriptTags?: () => void };
  }
}

const LOAD_ORDER: Array<{ src: string; type?: string }> = [
  { src: "https://unpkg.com/react@18.3.1/umd/react.development.js" },
  { src: "https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" },
  { src: "https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" },
  { src: "/prototype/tweaks-panel.jsx", type: "text/babel" },
  { src: "/prototype/tweaks.jsx", type: "text/babel" },
  { src: "/prototype/search.js" },
];

function appendScript(spec: { src: string; type?: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = spec.src;
    if (spec.type) s.type = spec.type;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${spec.src}`));
    document.body.appendChild(s);
    // type=text/babel scripts don't fire `onload` — they're not executed
    // by the browser, only fetched. Resolve so we can move on; we trigger
    // Babel.transformScriptTags() once everything's in place.
    if (spec.type === "text/babel") resolve();
  });
}

/**
 * Loads the prototype's mutating scripts after React hydrates.
 *
 * `search.js` adds `class="pp-search-trigger"` to a span and `tweaks.jsx`
 * stamps CSS vars on `<html>` plus `data-*` on `<body>`. If those ran
 * inline in <head>/<body>, they'd race React's hydration and produce
 * "tree hydrated but some attributes didn't match" warnings.
 *
 * Babel standalone only auto-scans for `type="text/babel"` once at its
 * own load time, so we trigger a manual `transformScriptTags()` after
 * the jsx files have been inserted.
 *
 * `image-slot.js` is loaded in the layout's <head> directly because it
 * only registers a custom element class, no DOM mutations to race.
 */
export function PrototypeRuntime() {
  const ranRef = useRef(false);
  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    (async () => {
      try {
        for (const spec of LOAD_ORDER) {
          await appendScript(spec);
        }
        // Compile any text/babel scripts that were appended after Babel
        // finished its initial auto-scan.
        window.Babel?.transformScriptTags?.();
        // `search.js` registers its topbar-hint promotion on DOMContentLoaded,
        // which already fired by the time we got here. Re-dispatch so its
        // listener runs once. It's the only DOMContentLoaded listener in
        // the prototype, so re-firing is safe.
        document.dispatchEvent(new Event("DOMContentLoaded"));
      } catch (e) {
        console.error("[PrototypeRuntime]", e);
      }
    })();
  }, []);
  return null;
}
