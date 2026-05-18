import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set — see .env.local.example",
    );
  }
  _stripe = new Stripe(key, {
    // Pin so SDK upgrades don't silently change response shapes.
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
  return _stripe;
}
