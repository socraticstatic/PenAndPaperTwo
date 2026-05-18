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

// Fetches the (zero-or-one) pairing flagged is_pairing_of_week. Returns
// null if no row is currently flagged. Used by the home page's
// featured-pairing hero block.
export async function fetchPairingOfTheWeek(): Promise<PairingWithSides | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pairings")
    .select("*, pen:pens(*), paper:papers(*)")
    .eq("is_pairing_of_week", true)
    .order("archive_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`fetchPairingOfTheWeek failed: ${error.message}`);
  }
  return data as unknown as PairingWithSides | null;
}

// Fetches pairings that feature a specific pen. Used by the pen detail
// page's writing-sample card grid.
export async function fetchPairingsForPen(
  penId: string,
  limit?: number,
): Promise<PairingWithSides[]> {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("pairings")
    .select("*, pen:pens(*), paper:papers(*)")
    .eq("pen_id", penId)
    .order("affinity_score", { ascending: false });
  if (limit != null) q = q.limit(limit);
  const { data, error } = await q;
  if (error) {
    throw new Error(`fetchPairingsForPen(${penId}) failed: ${error.message}`);
  }
  return (data ?? []) as unknown as PairingWithSides[];
}

// Mirror of fetchPairingsForPen for the paper detail page.
export async function fetchPairingsForPaper(
  paperId: string,
  limit?: number,
): Promise<PairingWithSides[]> {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("pairings")
    .select("*, pen:pens(*), paper:papers(*)")
    .eq("paper_id", paperId)
    .order("affinity_score", { ascending: false });
  if (limit != null) q = q.limit(limit);
  const { data, error } = await q;
  if (error) {
    throw new Error(
      `fetchPairingsForPaper(${paperId}) failed: ${error.message}`,
    );
  }
  return (data ?? []) as unknown as PairingWithSides[];
}

// Used by the home page's pairings catalogue. Joins pen+paper sides.
export async function fetchPairings(
  limit?: number,
): Promise<PairingWithSides[]> {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("pairings")
    .select("*, pen:pens(*), paper:papers(*)")
    .order("affinity_score", { ascending: false });
  if (limit != null) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw new Error(`fetchPairings failed: ${error.message}`);
  return (data ?? []) as unknown as PairingWithSides[];
}
