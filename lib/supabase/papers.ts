import { createSupabaseServerClient, createSupabaseBuildClient } from "./server";
import type { Database } from "./database.types";

export type PaperRow = Database["public"]["Tables"]["papers"]["Row"];

// JSONB shapes for papers live in lib/supabase/jsonb-shapes.ts as
// PaperSubstance / PaperSurface / PaperPerformance / PaperAppearance /
// PaperFormat plus the cross-entity Editorial / Pricing shapes.

export async function fetchPaperById(id: string): Promise<PaperRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("papers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`fetchPaperById(${id}) failed: ${error.message}`);
  return data;
}

export async function listPaperIds(): Promise<string[]> {
  const supabase = createSupabaseBuildClient();
  const { data, error } = await supabase.from("papers").select("id");
  if (error) throw new Error(`listPaperIds failed: ${error.message}`);
  return (data ?? []).map((r) => r.id);
}

// Used by the home page's paper-archive grid.
export async function fetchPapers(limit?: number): Promise<PaperRow[]> {
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("papers").select("*").order("archive_number", { ascending: true });
  if (limit != null) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw new Error(`fetchPapers failed: ${error.message}`);
  return data ?? [];
}
