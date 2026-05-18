import { PrototypeShell } from "@/components/PrototypeShell";
import { fetchPens } from "@/lib/supabase/pens";
import { fetchPapers } from "@/lib/supabase/papers";
import {
  fetchPairings,
  fetchPairingOfTheWeek,
} from "@/lib/supabase/pairings";
import { fetchEntityTotals, fetchSiteMeta } from "@/lib/supabase/site-meta";
import { fetchPageCopy } from "@/lib/supabase/page-copy";
import { buildHomeReplace } from "@/lib/entities/home-replace";

// Home page binds every visible string + entity reference on index.html:
//   - Entity grids (pens, papers, pairings catalogue) → DB rows
//   - Pairing-of-the-week hero → pairings WHERE is_pairing_of_week
//   - Masthead chrome → public.site_meta key/value
//   - "N Entries" total → computed sum of row counts
//   - Section heads, kickers, principle cards → public.page_copy
//   - Comparison tray, picker results → empty states until real engines
//
// page_copy supports {placeholder} template substitution so author can
// edit "Twenty-two pens, weighed and described." once and the count
// auto-updates as more rows seed.
export default async function HomePage() {
  const [pens, papers, pairings, pairingOfWeek, siteMeta, totals, pageCopy] =
    await Promise.all([
      fetchPens(8),
      fetchPapers(8),
      fetchPairings(4),
      fetchPairingOfTheWeek(),
      fetchSiteMeta(),
      fetchEntityTotals(),
      fetchPageCopy(),
    ]);
  return (
    <PrototypeShell
      prototypeFile="index.html"
      replace={buildHomeReplace({
        pens,
        papers,
        pairings,
        pairingOfWeek,
        siteMeta,
        totals,
        pageCopy,
      })}
    />
  );
}
