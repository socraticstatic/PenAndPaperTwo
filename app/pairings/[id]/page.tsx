import type { Metadata } from "next";
import { EntityDetailPage } from "@/components/EntityDetailPage";
import {
  fetchPairingById,
  listPairingIds,
  type PairingWithSides,
} from "@/lib/supabase/pairings";
import { buildPairingReplace } from "@/lib/entities/pairing-replace";

type Params = { id: string };

export async function generateStaticParams(): Promise<Params[]> {
  const ids = await listPairingIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const pr = await fetchPairingById(id);
  if (!pr?.pen || !pr.paper) return { title: "Pairing — Pen & Paper" };
  return {
    title: `Pairing № ${String(pr.archive_number).padStart(3, "0")} · ${pr.pen.model} × ${pr.paper.model} — Pen & Paper`,
  };
}

export default async function PairingDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const pairing = await fetchPairingById(id);
  return (
    <EntityDetailPage<PairingWithSides>
      prototypeFile="pairing.html"
      row={pairing}
      buildReplace={buildPairingReplace}
      notFound={
        <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
          <h1>Pairing not found</h1>
          <p>
            No row in <code>public.pairings</code> with <code>id = {id}</code>.
          </p>
        </main>
      }
    />
  );
}
