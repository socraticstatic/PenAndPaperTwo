import type { Metadata } from "next";
import { EntityDetailPage } from "@/components/EntityDetailPage";
import {
  fetchPaperById,
  listPaperIds,
  type PaperRow,
} from "@/lib/supabase/papers";
import { buildPaperReplace } from "@/lib/entities/paper-replace";

type Params = { id: string };

export async function generateStaticParams(): Promise<Params[]> {
  const ids = await listPaperIds();
  return ids.map((id) => ({ id }));
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
  const paper = await fetchPaperById(id);
  return (
    <EntityDetailPage<PaperRow>
      prototypeFile="paper.html"
      row={paper}
      buildReplace={buildPaperReplace}
      notFound={
        <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
          <h1>Paper not found</h1>
          <p>
            No row in <code>public.papers</code> with <code>id = {id}</code>.
          </p>
        </main>
      }
    />
  );
}
