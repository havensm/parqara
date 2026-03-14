import { NextResponse } from "next/server";

import { requireApiUser } from "@/app/api/_utils";
import { isStripeBillingConfigured } from "@/lib/billing-env";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const user = await requireApiUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  if (!isStripeBillingConfigured()) {
    return NextResponse.redirect(new URL("/profile?billing=portal-unavailable", origin));
  }

  // TODO: Redirect into the Stripe Billing Portal once the Stripe SDK is wired.
  return NextResponse.redirect(new URL("/profile?billing=portal-pending", origin));
}
