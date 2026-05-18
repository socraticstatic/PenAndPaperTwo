import type { Metadata } from "next";
import { EntityDetailPage } from "@/components/EntityDetailPage";
import { fetchPenById, listPenIds, type PenRow } from "@/lib/supabase/pens";
import { buildPenReplace } from "@/lib/entities/pen-replace";

type Params = { id: string };

export async function generateStaticParams(): Promise<Params[]> {
  const ids = await listPenIds();
  return ids.map((id) => ({ id }));
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
  const pen = await fetchPenById(id);
  return (
    <EntityDetailPage<PenRow>
      prototypeFile="pen.html"
      row={pen}
      buildReplace={buildPenReplace}
      notFound={
        <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
          <h1>Pen not found</h1>
          <p>
            No row in <code>public.pens</code> with <code>id = {id}</code>.
          </p>
        </main>
      }
    />
  );
}
