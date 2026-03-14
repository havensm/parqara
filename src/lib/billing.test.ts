import { describe, expect, it } from "vitest";

import {
  canAccessBillingFeature,
  canCreatePlanner,
  canUseFreePreview,
  getEffectiveSubscriptionTier,
  getMaraStarterPreviewState,
  getPlannerLimitForTier,
  getUserBillingState,
  MARA_STARTER_REPLY_LIMIT,
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
    expect(canAccessBillingFeature("PLUS", "aiConcierge")).toBe(true);
    expect(canAccessBillingFeature("PRO", "aiConcierge")).toBe(true);
    expect(canAccessBillingFeature("PLUS", "plannerDuplication")).toBe(false);
    expect(canAccessBillingFeature("PRO", "plannerDuplication")).toBe(true);
  });

  it("keeps the Mara preview only on Free", () => {
    expect(getMaraStarterPreviewState("FREE", 0)).toEqual({
      included: true,
      replyLimit: MARA_STARTER_REPLY_LIMIT,
      usedReplies: 0,
      remainingReplies: MARA_STARTER_REPLY_LIMIT,
      canSend: true,
    });

    expect(getMaraStarterPreviewState("PLUS", MARA_STARTER_REPLY_LIMIT)).toEqual({
      included: false,
      replyLimit: MARA_STARTER_REPLY_LIMIT,
      usedReplies: 0,
      remainingReplies: 0,
      canSend: false,
    });
  });

  it("tracks planner limits by tier", () => {
    expect(getPlannerLimitForTier("FREE")).toBe(1);
    expect(getPlannerLimitForTier("PLUS")).toBe(3);
    expect(getPlannerLimitForTier("PRO")).toBe(10);
    expect(canCreatePlanner({ currentTier: "FREE", activePlannerCount: 0 })).toBe(true);
    expect(canCreatePlanner({ currentTier: "FREE", activePlannerCount: 1 })).toBe(false);
  });

  it("allows the free preview only while the preview remains and the planner is active", () => {
    expect(
      canUseFreePreview(
        {
          subscriptionTier: "FREE",
          subscriptionStatus: "INACTIVE",
          maraPreviewRepliesUsed: 0,
        },
        { plannerStatus: "ACTIVE" }
      )
    ).toBe(true);

    expect(
      canUseFreePreview(
        {
          subscriptionTier: "FREE",
          subscriptionStatus: "INACTIVE",
          maraPreviewRepliesUsed: 1,
        },
        { plannerStatus: "ACTIVE" }
      )
    ).toBe(false);

    expect(
      canUseFreePreview(
        {
          subscriptionTier: "FREE",
          subscriptionStatus: "INACTIVE",
          maraPreviewRepliesUsed: 0,
        },
        { plannerStatus: "ARCHIVED" }
      )
    ).toBe(false);
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
    expect(BILLING_PLANS.FREE.features).toContain("Calendar view, private trip feed, and notifications");
    expect(BILLING_PLANS.FREE.features.join(" ")).not.toMatch(/share|collaborator|invite/i);
    expect(BILLING_PLANS.PLUS.summary).not.toMatch(/export|itinerary generation/i);
    expect(BILLING_PLANS.PRO.features).toContain("Collaborator invites and shared planner management");
    expect(BILLING_FEATURES.tripCollaboration.label).toBe("Shared planner collaboration");
    expect(BILLING_FEATURES.professionalExports.label).toBe("Future export tools");
  });
});
