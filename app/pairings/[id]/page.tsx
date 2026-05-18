import type { Metadata } from "next";
import { PrototypeShell } from "@/components/PrototypeShell";
import { fetchPairingById, listPairingIds } from "@/lib/supabase/pairings";
import { buildPairingReplace } from "@/lib/entities/pairing-replace";

type Params = { id: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await listPairingIds()).map((id) => ({ id }));
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
  if (!pairing) {
    return (
      <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
        <h1>Pairing not found</h1>
        <p>
          No row in <code>public.pairings</code> with <code>id = {id}</code>.
        </p>
      </main>
    );
  }
  return (
    <PrototypeShell
      prototypeFile="pairing.html"
      replace={buildPairingReplace(pairing)}
    />
  );
}
