import { createSupabaseServerClient } from "./server";

// The old singular routes (/pen, /paper, /pairing, /ink-detail) redirect
// to the dynamic /<entity>s/[id] route. Rather than hard-code an entity
// ID for each redirect, we pick the row with the lowest archive_number
// at request time — i.e. "Pen №001". If the table is empty, returns
// null and the caller renders a "no entities seeded yet" page.

async function firstId(table: "pens" | "papers" | "pairings" | "inks") {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .order("archive_number", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`firstId(${table}) failed: ${error.message}`);
  }
  return data?.id ?? null;
}

export const firstPenId = () => firstId("pens");
export const firstPaperId = () => firstId("papers");
export const firstPairingId = () => firstId("pairings");
export const firstInkId = () => firstId("inks");
