import type { SubscriptionTierValue } from "@/lib/contracts";
import type { PaidPlanTier } from "@/lib/billing-links";

const stripePriceEnvKeys: Record<PaidPlanTier, string> = {
  PLUS: "STRIPE_PRICE_PLUS_MONTHLY",
  PRO: "STRIPE_PRICE_PRO_MONTHLY",
};

export function getStripePriceIdForTier(tier: PaidPlanTier) {
  const key = stripePriceEnvKeys[tier];
  const value = process.env[key];

  return value?.trim() ? value : null;
}

export function isPaidSubscriptionTier(tier: SubscriptionTierValue): tier is PaidPlanTier {
  return tier === "PLUS" || tier === "PRO";
}

export function isStripeBillingConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      process.env.STRIPE_SECRET_KEY &&
      getStripePriceIdForTier("PLUS") &&
      getStripePriceIdForTier("PRO")
  );
}
