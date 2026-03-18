import { describe, expect, it } from "vitest";

import {
  canAccessBillingFeature,
  canCreatePlanner,
  canUseFreePreview,
  getEffectiveSubscriptionTier,
  getPlannerLimitForTier,
  getUserBillingState,
  BILLING_FEATURES,
  BILLING_PLANS,
} from "@/lib/billing";

describe("billing access", () => {
  it("downgrades paid tiers without an active subscription back to free access", () => {
    expect(getEffectiveSubscriptionTier("PLUS", "CANCELED")).toBe("FREE");
    expect(getEffectiveSubscriptionTier("PRO", "PAST_DUE")).toBe("FREE");
  });

  it("keeps active paid tiers unlocked", () => {
    expect(getEffectiveSubscriptionTier("PLUS", "ACTIVE")).toBe("PLUS");
    expect(getEffectiveSubscriptionTier("PRO", "TRIALING")).toBe("PRO");
  });

  it("enforces feature thresholds", () => {
    expect(canAccessBillingFeature("FREE", "liveDashboard")).toBe(false);
    expect(canAccessBillingFeature("PLUS", "liveDashboard")).toBe(true);
    expect(canAccessBillingFeature("FREE", "aiConcierge")).toBe(false);
    expect(canAccessBillingFeature("PLUS", "aiConcierge")).toBe(true);
    expect(canAccessBillingFeature("PRO", "aiConcierge")).toBe(true);
    expect(canAccessBillingFeature("FREE", "tripCollaboration")).toBe(true);
    expect(canAccessBillingFeature("PLUS", "tripCollaboration")).toBe(true);
    expect(canAccessBillingFeature("PLUS", "plannerDuplication")).toBe(false);
    expect(canAccessBillingFeature("PRO", "plannerDuplication")).toBe(true);
  });

  it("tracks planner limits by tier", () => {
    expect(getPlannerLimitForTier("FREE")).toBe(1);
    expect(getPlannerLimitForTier("PLUS")).toBe(3);
    expect(getPlannerLimitForTier("PRO")).toBe(10);
    expect(canCreatePlanner({ currentTier: "FREE", activePlannerCount: 0 })).toBe(true);
    expect(canCreatePlanner({ currentTier: "FREE", activePlannerCount: 1 })).toBe(false);
  });

  it("keeps the legacy preview helper off", () => {
    expect(canUseFreePreview()).toBe(false);
  });

  it("summarizes the current plan and entitlements", () => {
    const billing = getUserBillingState({
      subscriptionTier: "PRO",
      subscriptionStatus: "ACTIVE",
      maraPreviewRepliesUsed: 1,
      activePlannerCount: 4,
    });

    expect(billing.currentTier).toBe("PRO");
    expect(billing.currentPlan.name).toBe("Pro");
    expect(billing.featureAccess.tripCollaboration).toBe(true);
    expect(billing.featureAccess.aiConcierge).toBe(true);
    expect(billing.plannerAllowance.limit).toBe(10);
    expect(billing.maraStarterPreview.included).toBe(false);
  });

  it("keeps plan copy aligned with shipped tier boundaries", () => {
    expect(BILLING_PLANS.FREE.features).toContain("1 active planner");
    expect(BILLING_PLANS.FREE.summary).toMatch(/manual/i);
    expect(BILLING_PLANS.FREE.features.join(" ")).toMatch(/share|collaborator|invite/i);
    expect(BILLING_PLANS.PLUS.summary).toMatch(/Mara|three active planners|live mode/i);
    expect(BILLING_PLANS.PRO.features.join(" ")).not.toMatch(/collaborator|shared planner/i);
    expect(BILLING_FEATURES.aiConcierge.requiredTier).toBe("PLUS");
    expect(BILLING_FEATURES.tripCollaboration.label).toBe("Shared planner collaboration");
    expect(BILLING_FEATURES.professionalExports.label).toBe("Future export tools");
  });
});
