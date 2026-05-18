import { redirect } from "next/navigation";
import { firstPenId } from "@/lib/supabase/redirect-helpers";

// Legacy singular route. Redirects to /pens/<lowest-archive-number-id>.
// Kept so the prototype's cross-page `href="pen.html"` links (rewritten
// to `/pen` by the html-react-parser load step) still land somewhere.
export default async function PenLegacyPage() {
  const id = await firstPenId();
  if (!id) {
    return (
      <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
        <h1>No pens seeded</h1>
        <p>
          The <code>public.pens</code> table is empty. Run{" "}
          <code>supabase/seeds/01_pilot_custom_823.sql</code>.
        </p>
      </main>
    );
  }
  redirect(`/pens/${id}`);
}
