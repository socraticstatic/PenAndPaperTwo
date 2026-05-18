import { loadPrototypePage } from "@/lib/prototype";
import { PrototypeBody } from "@/components/PrototypeBody";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadPrototypePage("pen.html");
  return { title: page.title };
}

export default async function PenPage() {
  const page = await loadPrototypePage("pen.html");
  return <PrototypeBody page={page} />;
}
