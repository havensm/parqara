export function isStripeBillingConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_PLUS_MONTHLY &&
      process.env.STRIPE_PRICE_PRO_MONTHLY
  );
}
