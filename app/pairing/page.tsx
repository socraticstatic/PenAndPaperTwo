import { loadPrototypePage } from "@/lib/prototype";
import { PrototypeBody } from "@/components/PrototypeBody";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadPrototypePage("pairing.html");
  return { title: page.title };
}

export default async function PairingPage() {
  const page = await loadPrototypePage("pairing.html");
  return <PrototypeBody page={page} />;
}
