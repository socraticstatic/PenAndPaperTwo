import type { Metadata } from "next";
import { PrototypeShell } from "@/components/PrototypeShell";
import { fetchPenById, listPenIds } from "@/lib/supabase/pens";
import { fetchPairingsForPen } from "@/lib/supabase/pairings";
import { fetchEntityTotals } from "@/lib/supabase/site-meta";
import { buildPenReplace } from "@/lib/entities/pen-replace";

type Params = { id: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await listPenIds()).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const pen = await fetchPenById(id);
  return {
    title: pen ? `${pen.brand} ${pen.model} — Pen & Paper` : "Pen — Pen & Paper",
  };
}

export default async function PenDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const [pen, pairings, totals] = await Promise.all([
    fetchPenById(id),
    fetchPairingsForPen(id, 3),
    fetchEntityTotals(),
  ]);
  if (!pen) {
    return (
      <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
        <h1>Pen not found</h1>
        <p>
          No row in <code>public.pens</code> with <code>id = {id}</code>.
        </p>
      </main>
    );
  }
  return (
    <PrototypeShell
      prototypeFile="pen.html"
      replace={buildPenReplace(pen, pairings, totals.pens)}
    />
  );
}
