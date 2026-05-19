import type { Metadata } from "next";
import { PrototypeShell } from "@/components/PrototypeShell";
import { fetchPaperById, listPaperIds } from "@/lib/supabase/papers";
import {
  fetchPairingsForPaper,
  fetchPenMatchesForPaper,
} from "@/lib/supabase/pairings";
import { fetchEntityTotals } from "@/lib/supabase/site-meta";
import { buildPaperReplace } from "@/lib/entities/paper-replace";

type Params = { id: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await listPaperIds()).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await fetchPaperById(id);
  return { title: p ? `${p.model} — Pen & Paper` : "Paper — Pen & Paper" };
}

export default async function PaperDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const [paper, pairings, totals, penMatches] = await Promise.all([
    fetchPaperById(id),
    fetchPairingsForPaper(id, 3),
    fetchEntityTotals(),
    fetchPenMatchesForPaper(id, 6),
  ]);
  if (!paper) {
    return (
      <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
        <h1>Paper not found</h1>
        <p>
          No row in <code>public.papers</code> with <code>id = {id}</code>.
        </p>
      </main>
    );
  }
  return (
    <PrototypeShell
      prototypeFile="paper.html"
      replace={buildPaperReplace(paper, pairings, totals.papers, penMatches)}
    />
  );
}
