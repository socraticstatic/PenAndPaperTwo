import { createSupabaseServerClient } from "./server";
import type { Database } from "./database.types";

export type InkRow = Database["public"]["Tables"]["inks"]["Row"];

export type InkColor = {
  hex?: string;
  name?: string;
  sheenHex?: string;
  shadingLow?: string;
};
export type InkPerformance = {
  sheenVisibility?: number;
  shadingVisibility?: number;
  dryTimeBaseSec?: number;
};
export type InkPricing = { priceTier?: string; msrpUsd?: number; bottleMl?: number };
export type InkEditorial = {
  deck?: string;
  tastingNote?: string;
  editorPick?: boolean | string;
};

export async function fetchInkById(id: string): Promise<InkRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inks")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(`fetchInkById(${id}) failed: ${error.message}`);
  return data;
}
