import { createSupabaseServerClient } from "./server";

// Masthead chrome lives in public.site_meta as key/value rows so the
// editor can change the volume/issue/season/tagline through Supabase
// Studio without a code deploy. fetchSiteMeta returns a flat map.
export async function fetchSiteMeta(): Promise<Record<string, string>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_meta")
    .select("key, value");
  if (error) throw new Error(`fetchSiteMeta failed: ${error.message}`);
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

// Computed total count across all entity tables. The masthead's
// "312 Entries" line should reflect what the editor has actually
// catalogued — not a frozen number.
export async function fetchEntityTotals(): Promise<{
  pens: number;
  papers: number;
  pairings: number;
  inks: number;
  total: number;
}> {
  const supabase = await createSupabaseServerClient();
  const [pens, papers, pairings, inks] = await Promise.all([
    supabase.from("pens").select("id", { count: "exact", head: true }),
    supabase.from("papers").select("id", { count: "exact", head: true }),
    supabase.from("pairings").select("id", { count: "exact", head: true }),
    supabase.from("inks").select("id", { count: "exact", head: true }),
  ]);
  const totals = {
    pens: pens.count ?? 0,
    papers: papers.count ?? 0,
    pairings: pairings.count ?? 0,
    inks: inks.count ?? 0,
    total: 0,
  };
  totals.total = totals.pens + totals.papers + totals.pairings + totals.inks;
  return totals;
}
