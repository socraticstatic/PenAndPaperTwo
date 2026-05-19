"use client";

import { useEffect, useState } from "react";
import {
  addCompareItem,
  removeCompareItem,
  useCompareItems,
  type CompareItem,
} from "@/lib/client/compare";

// Small toggle button that appears next to the hero CTAs on detail
// pages. Joins/leaves the compare tray; persists across reloads.
export function AddToCompareButton({ item }: { item: CompareItem }) {
  const compareItems = useCompareItems();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const inCompare = hydrated && compareItems.some((x) => x.id === item.id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        if (inCompare) removeCompareItem(item.id);
        else addCompareItem(item);
      }}
      aria-pressed={inCompare}
      style={{
        appearance: "none",
        border: "0.5px solid oklch(40% 0.02 80 / 0.35)",
        background: inCompare ? "oklch(35% 0.13 25)" : "transparent",
        color: inCompare ? "oklch(98% 0.005 80)" : "oklch(22% 0.02 80)",
        padding: "8px 16px",
        fontFamily: "var(--font-mono, monospace)",
        fontSize: 11,
        letterSpacing: "0.06em",
        cursor: "pointer",
      }}
    >
      {hydrated ? (inCompare ? "✓ In compare" : "+ Compare") : "+ Compare"}
    </button>
  );
}
