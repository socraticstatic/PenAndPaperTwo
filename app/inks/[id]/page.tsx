import type { Metadata } from "next";
import { EntityDetailPage } from "@/components/EntityDetailPage";
import { fetchInkById, listInkIds, type InkRow } from "@/lib/supabase/inks";
import { buildInkReplace } from "@/lib/entities/ink-replace";

type Params = { id: string };

export async function generateStaticParams(): Promise<Params[]> {
  const ids = await listInkIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const ink = await fetchInkById(id);
  return {
    title: ink
      ? `${ink.brand} ${ink.model} — Pen & Paper`
      : "Ink — Pen & Paper",
  };
}

export default async function InkDetailDynamicPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const ink = await fetchInkById(id);
  return (
    <EntityDetailPage<InkRow>
      prototypeFile="ink-detail.html"
      row={ink}
      buildReplace={buildInkReplace}
      notFound={
        <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
          <h1>Ink not found</h1>
          <p>
            No row in <code>public.inks</code> with <code>id = {id}</code>.
          </p>
        </main>
      }
    />
  );
}
