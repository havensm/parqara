import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiUser } from "@/app/api/_utils";
import { getUserBillingState } from "@/lib/billing";
import { isStripeBillingConfigured } from "@/lib/billing-env";
import { isPaidPlanTier } from "@/lib/billing-links";

const paidTierSchema = z.enum(["PLUS", "PRO"]);

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const requestedTier = new URL(request.url).searchParams.get("tier");
  const parsedTier = paidTierSchema.safeParse(requestedTier);
  if (!parsedTier.success || !isPaidPlanTier(parsedTier.data)) {
    return NextResponse.redirect(new URL("/pricing", origin));
  }

  const billing = getUserBillingState(user);
  if (billing.currentTier === parsedTier.data) {
    return NextResponse.redirect(new URL(`/profile?billing=current-plan&tier=${parsedTier.data}`, origin));
  }

  if (!isStripeBillingConfigured()) {
    return NextResponse.redirect(new URL(`/pricing?billing=checkout-unavailable&tier=${parsedTier.data}`, origin));
  }

  // TODO: Create a Stripe Checkout session for the selected recurring price and redirect to session.url.
  return NextResponse.redirect(new URL(`/pricing?billing=checkout-pending&tier=${parsedTier.data}`, origin));
}
