import { createSupabaseServerClient, createSupabaseBuildClient } from "./server";
import type { Database } from "./database.types";

export type PenRow = Database["public"]["Tables"]["pens"]["Row"];

// JSONB shapes for pens live in lib/supabase/jsonb-shapes.ts as
// PenNib / PenInkDelivery / PenBody / PenDimensions / PenErgonomics /
// PenPerformance plus the cross-entity Editorial / Pricing shapes.

export async function fetchPenById(id: string): Promise<PenRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pens")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`fetchPenById(${id}) failed: ${error.message}`);
  return data;
}

// generateStaticParams runs outside a request scope, so this uses the
// stateless build-time client (no cookies). Public-read RLS allows it.
export async function listPenIds(): Promise<string[]> {
  const supabase = createSupabaseBuildClient();
  const { data, error } = await supabase.from("pens").select("id");
  if (error) throw new Error(`listPenIds failed: ${error.message}`);
  return (data ?? []).map((r) => r.id);
}
