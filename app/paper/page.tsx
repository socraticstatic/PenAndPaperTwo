import { loadPrototypePage } from "@/lib/prototype";
import { PrototypeBody } from "@/components/PrototypeBody";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadPrototypePage("paper.html");
  return { title: page.title };
}

export default async function PaperPage() {
  const page = await loadPrototypePage("paper.html");
  return <PrototypeBody page={page} />;
}
