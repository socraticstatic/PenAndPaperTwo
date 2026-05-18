import { createSupabaseServerClient, createSupabaseBuildClient } from "./server";
import type { Database } from "./database.types";
import type { PenRow } from "./pens";
import type { PaperRow } from "./papers";

export type PairingRow = Database["public"]["Tables"]["pairings"]["Row"];

export type PairingWithSides = PairingRow & {
  pen: PenRow | null;
  paper: PaperRow | null;
};

// JSONB shapes for pairings live in lib/supabase/jsonb-shapes.ts as
// PairingScoring / PairingMeasurements / PairingConditions plus the
// cross-entity Editorial shape.

export async function fetchPairingById(
  id: string,
): Promise<PairingWithSides | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pairings")
    .select("*, pen:pens(*), paper:papers(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`fetchPairingById(${id}) failed: ${error.message}`);
  }
  return data as unknown as PairingWithSides | null;
}

export async function listPairingIds(): Promise<string[]> {
  const supabase = createSupabaseBuildClient();
  const { data, error } = await supabase.from("pairings").select("id");
  if (error) throw new Error(`listPairingIds failed: ${error.message}`);
  return (data ?? []).map((r) => r.id);
}
