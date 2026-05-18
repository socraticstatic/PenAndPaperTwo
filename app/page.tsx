import { loadPrototypePage } from "@/lib/prototype";
import { PrototypeBody } from "@/components/PrototypeBody";

export default async function HomePage() {
  const page = await loadPrototypePage("index.html");
  return <PrototypeBody page={page} />;
}
