import { redirect } from "next/navigation";
import { firstPaperId } from "@/lib/supabase/redirect-helpers";

// Legacy singular route. Redirects to /papers/<lowest-archive-number-id>.
export default async function PaperLegacyPage() {
  const id = await firstPaperId();
  if (!id) {
    return (
      <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
        <h1>No papers seeded</h1>
        <p>
          The <code>public.papers</code> table is empty. Run{" "}
          <code>supabase/seeds/02_tomoe_river_s.sql</code>.
        </p>
      </main>
    );
  }
  redirect(`/papers/${id}`);
}
