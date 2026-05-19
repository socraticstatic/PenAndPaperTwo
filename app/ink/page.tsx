import type { Metadata } from "next";
import { PrototypeShell } from "@/components/PrototypeShell";
import { loadPrototypePage } from "@/lib/prototype";
import { fetchInks } from "@/lib/supabase/inks";
import { fetchPageCopy } from "@/lib/supabase/page-copy";
import { buildInkArchiveReplace } from "@/lib/entities/ink-archive-replace";

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadPrototypePage("ink.html");
  return { title: page.title };
}

// Ink Cupboard archive. The prototype ships 8 hard-coded swatch cards;
// we replace the whole `.ink-archive` grid contents with `<a class=ink-card>`
// elements built from `public.inks` rows. Filter chips above the grid
// are left as-is for now — wiring them to facet RPC calls is D4 / future.
export default async function InkArchivePage() {
  const [inks, pageCopy] = await Promise.all([fetchInks(), fetchPageCopy()]);
  return (
    <PrototypeShell
      prototypeFile="ink.html"
      replace={buildInkArchiveReplace(inks, pageCopy)}
    />
  );
}
