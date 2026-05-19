"use client";

import {
  removeCompareItem,
  useCompareItems,
  type CompareItem,
} from "@/lib/client/compare";

// Sticky comparison tray. Reads live compare state, renders one slot
// per entity (max 4); empty slots show the prototype's "+ Add a
// specimen" placeholder.

function specimenSubLabel(item: CompareItem): string {
  if (item.kind === "pen") return `${item.brand} · pen`;
  if (item.kind === "paper") return `${item.brand} · paper`;
  return `${item.brand} · ink`;
}

const ROMAN = ["i.", "ii.", "iii.", "iv."];
const MAX = 4;

export function CompareTray() {
  const items = useCompareItems();
  const slots = Array.from({ length: MAX }, (_, i) => items[i] ?? null);
  const filled = items.length;
  return (
    <div className="tray" id="tray">
      <div className="tray-handle" id="tray-handle">
        <span className="h-eyebrow">Comparison flight</span>
        <span className="h-title">
          {filled} <em>of {MAX}</em> {filled === 1 ? "specimen" : "specimens"}
        </span>
      </div>
      <div className="tray-slots">
        {slots.map((item, idx) =>
          item ? (
            <div className="tray-slot" key={item.id}>
              <span className="tray-num">{ROMAN[idx]}</span>
              {item.kind === "ink" ? (
                <div
                  className="tray-mini"
                  style={{
                    background: item.hex ?? "#222",
                    borderRadius: "50%",
                  }}
                />
              ) : item.kind === "paper" ? (
                <div className={`tray-mini paper ${item.paperTone ?? ""}`} />
              ) : (
                <div
                  className="tray-mini"
                  style={{ color: item.silhouetteColor ?? "oklch(28% 0.04 80)" }}
                >
                  <svg viewBox="0 0 240 40">
                    <use href={`#${item.silhouetteId ?? "pen-classic"}`} />
                  </svg>
                </div>
              )}
              <div>
                <div className="ts-name">{item.model}</div>
                <span className="ts-sub">{specimenSubLabel(item)}</span>
              </div>
              <button
                className="ts-remove"
                title={`Remove ${item.model}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeCompareItem(item.id);
                }}
              >
                ×
              </button>
            </div>
          ) : (
            // eslint-disable-next-line react/no-array-index-key
            <div className="tray-slot empty" key={`empty-${idx}`}>
              <span className="tray-num">{ROMAN[idx]}</span>
              <span className="ts-plus">+</span>
              <div>
                <div className="ts-name">Add a specimen</div>
                <span className="ts-sub">Pen, paper or ink</span>
              </div>
              <span></span>
            </div>
          ),
        )}
      </div>
      <div className="tray-actions">
        <a href="#compare" className="primary">
          Open compare →
        </a>
      </div>
    </div>
  );
}

// helpers for the AddToCompareButton — re-export from the same
// surface so consumers only need this barrel.
export { addCompareItem, isInCompare, useCompareItems } from "@/lib/client/compare";
export type { CompareItem };
