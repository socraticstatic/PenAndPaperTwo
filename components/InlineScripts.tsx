"use client";

import { useEffect } from "react";

/**
 * Re-runs each prototype page's inline `<script>` blocks after the parsed
 * markup is in the DOM. Inline content rendered through React doesn't
 * execute — we have to append fresh <script> nodes ourselves.
 *
 * A short delay lets the layout's external scripts (image-slot.js,
 * React UMD, Babel, tweaks-*.jsx, search.js) attach first, so the
 * inline code can rely on globals like `document.querySelectorAll` against
 * a hydrated DOM and on any custom-element registrations from image-slot.
 */
export function InlineScripts({ scripts }: { scripts: string[] }) {
  useEffect(() => {
    if (!scripts.length) return;
    const appended: HTMLScriptElement[] = [];
    const handle = window.setTimeout(() => {
      for (const code of scripts) {
        const s = document.createElement("script");
        s.textContent = code;
        document.body.appendChild(s);
        appended.push(s);
      }
    }, 50);
    return () => {
      window.clearTimeout(handle);
      for (const s of appended) s.remove();
    };
  }, [scripts]);
  return null;
}
