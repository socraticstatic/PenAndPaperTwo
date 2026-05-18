import { PrototypeShell } from "@/components/PrototypeShell";
import { fetchPens } from "@/lib/supabase/pens";
import { fetchPapers } from "@/lib/supabase/papers";
import { fetchPairings } from "@/lib/supabase/pairings";
import { buildHomeReplace } from "@/lib/entities/home-replace";

// Home page binds the three entity archive grids on index.html to
// `public.pens`, `public.papers`, `public.pairings` (top N each, in
// archive-number order — affinity-score order for pairings). The
// prototype's hard-coded tiles are replaced wholesale by what the DB
// currently holds; grids render sparse until more entities seeded.
//
// Out of scope here:
// - Pairing-of-the-week hero block at top of index.html
// - Sticky comparison tray at the bottom
// - "Find a pairing" picker (interactive, no DB binding needed yet)
// - Masthead chrome ("Vol. IV — Spring", "312 entries") — editorial,
//   not a hard-coded entity reference.
export default async function HomePage() {
  const [pens, papers, pairings] = await Promise.all([
    fetchPens(8),
    fetchPapers(8),
    fetchPairings(4),
  ]);
  return (
    <PrototypeShell
      prototypeFile="index.html"
      replace={buildHomeReplace({ pens, papers, pairings })}
    />
  );
}
