import { redirect } from "next/navigation";
import { firstPairingId } from "@/lib/supabase/redirect-helpers";

// Legacy singular route. Redirects to /pairings/<lowest-archive-number-id>.
export default async function PairingLegacyPage() {
  const id = await firstPairingId();
  if (!id) {
    return (
      <main style={{ padding: "4rem 2rem", fontFamily: "monospace" }}>
        <h1>No pairings seeded</h1>
        <p>
          The <code>public.pairings</code> table is empty. Run{" "}
          <code>supabase/seeds/04_pairing_047_823_x_tomoe.sql</code>.
        </p>
      </main>
    );
  }
  redirect(`/pairings/${id}`);
}
