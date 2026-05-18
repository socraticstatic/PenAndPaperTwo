import { createSupabaseServerClient, createSupabaseBuildClient } from "./server";
import type { Database } from "./database.types";

export type InkRow = Database["public"]["Tables"]["inks"]["Row"];

// JSONB shapes for inks live in lib/supabase/jsonb-shapes.ts as
// InkColor / InkChemistry / InkPerformance / InkPairing plus the
// cross-entity Editorial / Pricing shapes.

export async function fetchInkById(id: string): Promise<InkRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`fetchInkById(${id}) failed: ${error.message}`);
  return data;
}

// Used by the /ink archive grid. Public-read RLS allows the SSR client
// to do this without auth. Returns rows in archive-number order so the
// grid renders in the same sequence the editor seeded them.
export async function fetchInks(limit?: number): Promise<InkRow[]> {
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("inks").select("*").order("archive_number", { ascending: true });
  if (limit != null) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw new Error(`fetchInks failed: ${error.message}`);
  return data ?? [];
}

export async function listInkIds(): Promise<string[]> {
  const supabase = createSupabaseBuildClient();
  const { data, error } = await supabase.from("inks").select("id");
  if (error) throw new Error(`listInkIds failed: ${error.message}`);
  return (data ?? []).map((r) => r.id);
}
