-- P2 · D3 — pens row-level security
-- Public-read for anon + authenticated. No write policies in P2 — writes
-- happen exclusively via Supabase Studio (which uses the service-role key
-- and bypasses RLS). Editor write UI is D11 and adds insert/update/delete
-- policies gated on a JWT claim.

alter table public.pens enable row level security;

create policy "pens are publicly readable"
  on public.pens
  for select
  to anon, authenticated
  using (true);
