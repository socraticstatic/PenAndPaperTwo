"use client";

import { useEffect, useState } from "react";

// Client-only compare tray state. Persisted to localStorage so the
// reader's selection survives reloads + cross-tab edits. Max 4 slots
// to match the prototype's tray UI.

export type CompareKind = "pen" | "paper" | "ink";

export type CompareItem = {
  id: string;
  kind: CompareKind;
  brand: string;
  model: string;
  // Optional UI hints
  variant?: string;
  archiveNumber?: number;
  silhouetteId?: string;
  silhouetteColor?: string;
  paperTone?: string;
  hex?: string;
};

const STORAGE_KEY = "pp.compare";
const MAX_ITEMS = 4;
const EVENT_NAME = "pp:compare-changed";

function read(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function write(items: CompareItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* quota / private mode — silent */
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getCompareItems(): CompareItem[] {
  return read();
}

export function addCompareItem(item: CompareItem): CompareItem[] {
  const items = read().filter((x) => x.id !== item.id);
  items.unshift(item);
  const next = items.slice(0, MAX_ITEMS);
  write(next);
  return next;
}

export function removeCompareItem(id: string): CompareItem[] {
  const next = read().filter((x) => x.id !== id);
  write(next);
  return next;
}

export function clearCompare(): CompareItem[] {
  write([]);
  return [];
}

export function isInCompare(id: string): boolean {
  return read().some((x) => x.id === id);
}

// React hook — re-renders on any change to the compare set in this
// tab (custom event) or another tab (storage event).
export function useCompareItems(): CompareItem[] {
  const [items, setItems] = useState<CompareItem[]>([]);
  useEffect(() => {
    const refresh = () => setItems(read());
    refresh();
    const onCustom = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    window.addEventListener(EVENT_NAME, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return items;
}
