import { redirect } from "next/navigation";
import { firstInkId } from "@/lib/supabase/redirect-helpers";

// Legacy singular route. Redirects to /inks/<lowest-archive-number-id>.
// Prototype's `href="ink-detail.html"` links land here after the
// html-react-parser rewrite.
export default async function InkDetailLegacyPage() {
  const id = await firstInkId();
  if (!id) {
    return (
      <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
        <h1>No inks seeded</h1>
        <p>
          The <code>public.inks</code> table is empty. Run{" "}
          <code>supabase/seeds/03_iroshizuku_tsuki_yo.sql</code>.
        </p>
      </main>
    );
  }
  redirect(`/inks/${id}`);
}
