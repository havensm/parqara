import { describe, expect, it } from "vitest";

import {
  canAccessBillingFeature,
  getEffectiveSubscriptionTier,
  getMaraStarterPreviewState,
  getUserBillingState,
  MARA_STARTER_REPLY_LIMIT,
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
    expect(canAccessBillingFeature("PLUS", "aiConcierge")).toBe(false);
    expect(canAccessBillingFeature("PRO", "aiConcierge")).toBe(true);
  });

  it("tracks Mara starter preview usage for non-Pro tiers", () => {
    expect(getMaraStarterPreviewState("FREE", 0)).toEqual({
      included: true,
      replyLimit: MARA_STARTER_REPLY_LIMIT,
      usedReplies: 0,
      remainingReplies: MARA_STARTER_REPLY_LIMIT,
      canSend: true,
    });

    expect(getMaraStarterPreviewState("PLUS", MARA_STARTER_REPLY_LIMIT)).toEqual({
      included: true,
      replyLimit: MARA_STARTER_REPLY_LIMIT,
      usedReplies: MARA_STARTER_REPLY_LIMIT,
      remainingReplies: 0,
      canSend: false,
    });
  });

  it("omits the starter preview once full Mara access is unlocked", () => {
    expect(getMaraStarterPreviewState("PRO", 2)).toEqual({
      included: false,
      replyLimit: MARA_STARTER_REPLY_LIMIT,
      usedReplies: 0,
      remainingReplies: 0,
      canSend: false,
    });
  });

  it("summarizes the current plan and entitlements", () => {
    const billing = getUserBillingState({
      subscriptionTier: "PRO",
      subscriptionStatus: "ACTIVE",
      maraPreviewRepliesUsed: 1,
    });

    expect(billing.currentTier).toBe("PRO");
    expect(billing.currentPlan.name).toBe("Pro");
    expect(billing.featureAccess.tripCollaboration).toBe(true);
    expect(billing.maraStarterPreview.included).toBe(false);
  });
});
