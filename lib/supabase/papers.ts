import { createSupabaseServerClient } from "./server";
import type { Database } from "./database.types";

export type PaperRow = Database["public"]["Tables"]["papers"]["Row"];

export type PaperSubstance = { gsm?: number; pulpSource?: string };
export type PaperSurface = { tooth?: string; sizing?: string; coating?: string };
export type PaperPerformance = {
  sheenVisibility?: number;
  bleedThroughTendency?: number;
  showThroughTendency?: number;
  dryTimeByNib?: Record<string, number | undefined>;
};
export type PaperAppearance = {
  tone?: string;
  warmth?: string;
  colorHex?: string;
  swatchClass?: string;
};
export type PaperPricing = { priceTier?: string; fromPriceLabel?: string };
export type PaperEditorial = {
  deck?: string;
  tastingNote?: string;
  editorPick?: boolean | string;
};

export async function fetchPaperById(id: string): Promise<PaperRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("papers")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(`fetchPaperById(${id}) failed: ${error.message}`);
  return data;
}
