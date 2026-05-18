import { PrototypeShell } from "@/components/PrototypeShell";
import { fetchPens } from "@/lib/supabase/pens";
import { fetchPapers } from "@/lib/supabase/papers";
import {
  fetchPairings,
  fetchPairingOfTheWeek,
} from "@/lib/supabase/pairings";
import { fetchEntityTotals, fetchSiteMeta } from "@/lib/supabase/site-meta";
import { buildHomeReplace } from "@/lib/entities/home-replace";

// Home page binds every entity reference on index.html to a real source:
//   - Pen / paper / pairing archive grids → DB rows
//   - Pairing-of-the-week hero            → pairing flagged is_pairing_of_week
//   - Masthead chrome (volume, season, etc.) → site_meta key/value table
//   - "N Entries" total                   → computed sum of row counts
//   - Comparison tray                     → empty state (no fake substitutes;
//     the real compare engine is roadmapped, not faked here)
//   - Picker result list / ⌘K search      → currently unbound; the real
//     engines (Euclidean match, DB-backed catalogue) are roadmapped
export default async function HomePage() {
  const [pens, papers, pairings, pairingOfWeek, siteMeta, totals] =
    await Promise.all([
      fetchPens(8),
      fetchPapers(8),
      fetchPairings(4),
      fetchPairingOfTheWeek(),
      fetchSiteMeta(),
      fetchEntityTotals(),
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
      })}
    />
  );
}
