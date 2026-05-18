import { createSupabaseServerClient } from "./server";

// Author-editable copy strings keyed by stable dot-path identifiers.
// Templates may reference dynamic values via {placeholder} tokens
// (e.g. {pen_count}, {pen_count_words}, {pairing_of_week_label}) —
// resolved at render time by `applyCopyVars`.

export type CopyVars = Record<string, string | number | null | undefined>;

export type CopyMap = Record<string, string>;

export async function fetchPageCopy(): Promise<CopyMap> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("page_copy")
    .select("key, value");
  if (error) throw new Error(`fetchPageCopy failed: ${error.message}`);
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

// Substitute {token} placeholders. Missing tokens render as empty
// string (not the literal {token}), so a partially-populated vars
// map degrades gracefully.
export function applyCopyVars(value: string, vars: CopyVars): string {
  return value.replace(/\{([a-z0-9_]+)\}/gi, (_full, key: string) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}

// Convenience: look up + substitute in one call. Returns the empty
// string if the key is missing (callers can hide the section with
// progressive disclosure).
export function copy(
  map: CopyMap,
  key: string,
  vars: CopyVars = {},
): string {
  const raw = map[key];
  return raw ? applyCopyVars(raw, vars) : "";
}

// Word-form numbers up to a few hundred, used for the editorial
// "One hundred and forty papers" phrasing. Falls back to digits for
// larger numbers (which never actually read well as words anyway).
const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven",
  "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
  "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
  "eighty", "ninety",
];

export function numberToWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return String(n);
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o === 0 ? TENS[t] : `${TENS[t]}-${ONES[o]}`;
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const prefix = `${ONES[h]} hundred`;
    if (rest === 0) return prefix;
    return `${prefix} and ${numberToWords(rest)}`;
  }
  return String(n);
}

// Capitalise first letter; used for the editorial "One hundred and forty"
// at the start of an h2.
export function ucfirst(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}
