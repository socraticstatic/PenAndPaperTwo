import { createSupabaseServerClient } from "./server";
import type { Database } from "./database.types";

export type PenRow = Database["public"]["Tables"]["pens"]["Row"];

// Narrow JSONB groupings. The generated types declare these as `Json`
// (an open recursive union) because Postgres doesn't tell Supabase what
// shape we packed in. The shapes below mirror design CLAUDE.md §4. Only
// fields we actually render on `/pen` are listed; add more as we bind them.
export type PenNib = {
  size?: string;
  sizeNormalized?: string;
  material?: string;
  flex?: string;
};
export type PenInkDelivery = {
  fillingSystem?: string;
  flow?: string;
};
export type PenBody = {
  material?: string;
};
export type PenDimensions = {
  lengthCappedMm?: number;
  weightCappedG?: number;
};
export type PenPricing = {
  priceTier?: string;
  msrpUsd?: number;
};
export type PenEditorial = {
  deck?: string;
  tastingNote?: string;
  editorPick?: boolean;
};

export async function fetchPenById(id: string): Promise<PenRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pens")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    // Don't silently fall back — caller should see the failure.
    throw new Error(`fetchPenById(${id}) failed: ${error.message}`);
  }
  return data;
}
