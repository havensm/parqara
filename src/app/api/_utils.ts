import { ZodError } from "zod";
import { NextResponse } from "next/server";

import type { SubscriptionStatusValue, SubscriptionTierValue } from "@/lib/contracts";
import { getCurrentUser } from "@/lib/auth/session";
import { BILLING_FEATURES, getPlanByTier, getUserBillingState, type BillingFeatureKey } from "@/lib/billing";
import { HttpError, isHttpError } from "@/lib/http-error";

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: error.issues,
      },
      { status: 400 }
    );
  }

  if (isHttpError(error)) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.details ?? {}),
      },
      { status: error.status, headers: error.headers }
    );
  }

  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "Unexpected server error",
    },
    { status: 500 }
  );
}

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return user;
}

export function requireApiFeatureAccess(
  user: { subscriptionTier: SubscriptionTierValue; subscriptionStatus: SubscriptionStatusValue },
  feature: BillingFeatureKey
) {
  const billing = getUserBillingState({
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
  });

  if (!billing.featureAccess[feature]) {
    const requiredTier = BILLING_FEATURES[feature].requiredTier;
    const requiredPlan = getPlanByTier(requiredTier);
    throw new HttpError(402, `Upgrade to ${requiredPlan.name} to unlock ${BILLING_FEATURES[feature].label.toLowerCase()}.`);
  }

  return billing.currentTier;
}
