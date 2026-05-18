import { createSupabaseServerClient } from "./server";
import type { Database } from "./database.types";
import type { PenRow } from "./pens";
import type { PaperRow } from "./papers";

export type PairingRow = Database["public"]["Tables"]["pairings"]["Row"];
export type PairingWithSides = PairingRow & {
  pen: PenRow | null;
  paper: PaperRow | null;
};

export type PairingEditorial = {
  deck?: string;
  tastingNote?: string;
};

// Joins pen + paper via FK so the /pairing hero can render
//   pen.model × paper.model
// in one round-trip.
export async function fetchPairingById(
  id: string,
): Promise<PairingWithSides | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pairings")
    .select("*, pen:pens(*), paper:papers(*)")
    .eq("id", id)
    .single();
  if (error) {
    throw new Error(`fetchPairingById(${id}) failed: ${error.message}`);
  }
  return data as unknown as PairingWithSides;
}
