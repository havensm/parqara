import { getPlanByTier } from "@/lib/billing";
import type { SubscriptionTierValue } from "@/lib/contracts";

export type PaidPlanTier = Exclude<SubscriptionTierValue, "FREE">;
export type BillingNoticeKey =
  | "checkout-unavailable"
  | "checkout-pending"
  | "portal-unavailable"
  | "portal-pending"
  | "current-plan";

const paidPlanTiers: PaidPlanTier[] = ["PLUS", "PRO"];

export const BILLING_PORTAL_HREF = "/api/billing/portal";

export function isPaidPlanTier(value: string | null | undefined): value is PaidPlanTier {
  return Boolean(value && paidPlanTiers.includes(value as PaidPlanTier));
}

export function getBillingCheckoutHref(tier: PaidPlanTier) {
  return `/api/billing/checkout?tier=${tier}`;
}

export function getBillingNotice(
  key: string | null | undefined,
  tier: string | null | undefined
): { title: string; detail: string; tone: "amber" | "sky" } | null {
  if (!key) {
    return null;
  }

  const planName = isPaidPlanTier(tier) ? getPlanByTier(tier).name : "that plan";

  switch (key) {
    case "checkout-unavailable":
      return {
        title: `${planName} checkout is not live yet`,
        detail:
          "Stripe keys and price IDs are still missing in this environment. The upgrade path is scaffolded, but live checkout is not connected yet.",
        tone: "amber",
      };
    case "checkout-pending":
      return {
        title: `${planName} checkout still needs Stripe wiring`,
        detail:
          "The app now routes upgrades through a dedicated billing boundary. The remaining TODO is creating the Stripe Checkout session and redirecting to it.",
        tone: "amber",
      };
    case "portal-unavailable":
      return {
        title: "Billing management is not live yet",
        detail:
          "The billing portal entry point exists, but Stripe configuration is still missing for this environment.",
        tone: "amber",
      };
    case "portal-pending":
      return {
        title: "Billing portal still needs Stripe wiring",
        detail:
          "The portal route is scaffolded. The remaining TODO is redirecting signed-in customers into the Stripe Billing Portal.",
        tone: "amber",
      };
    case "current-plan":
      return {
        title: "You are already on this plan",
        detail: "No change was made. Choose a higher tier to upgrade, or open billing management if you want to downgrade later.",
        tone: "sky",
      };
    default:
      return null;
  }
}
