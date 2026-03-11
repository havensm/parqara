import Link from "next/link";

import { getBillingStatusLabel, getUserBillingState } from "@/lib/billing";
import { isStripeBillingConfigured } from "@/lib/billing-env";
import { requireCompletedOnboardingUser } from "@/lib/auth/guards";

import { PlanBadge } from "@/components/billing/plan-badge";
import { PricingGrid } from "@/components/billing/pricing-grid";
import { AppShell } from "@/components/app/app-shell";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function BillingPage() {
  const user = await requireCompletedOnboardingUser();
  const billing = getUserBillingState(user);
  const stripeConfigured = isStripeBillingConfigured();

  return (
    <AppShell
      eyebrow="Billing"
      title="Choose the planning depth that matches the trip."
      description="Free covers the core planner and a short Mara starter preview. Plus unlocks live park tools, and Pro opens the full AI concierge plus shared workspaces."
    >
      <Card className="p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Current subscription</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
                {billing.currentPlan.name}
              </h2>
              <PlanBadge tier={billing.currentTier} />
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                {getBillingStatusLabel(user.subscriptionStatus)}
              </span>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{billing.currentPlan.summary}</p>
          </div>
          <Link href="/profile" className={buttonStyles({ variant: "secondary", size: "default" })}>
            Back to profile
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Live dashboard", unlocked: billing.featureAccess.liveDashboard },
            { label: "Instant replans", unlocked: billing.featureAccess.liveReplan },
            { label: "Mara concierge", unlocked: billing.featureAccess.aiConcierge },
            { label: "Trip collaboration", unlocked: billing.featureAccess.tripCollaboration },
          ].map((item) => (
            <div key={item.label} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Feature</p>
              <p className="mt-2 font-semibold text-slate-950">{item.label}</p>
              <p className="mt-2 text-sm text-slate-500">{item.unlocked ? "Included on your plan" : "Upgrade to unlock"}</p>
            </div>
          ))}
        </div>
      </Card>

      {!stripeConfigured ? (
        <Card className="p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Stripe status</p>
          <h2 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
            Self-serve checkout is still waiting on Stripe keys.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            The pricing model and feature gates are in place. Add the Stripe publishable key, secret key, and live price IDs to turn on upgrade flows.
          </p>
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Plans</p>
          <h2 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Compare the three subscription tiers.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Plus is positioned for live park-day execution. Pro is where Mara becomes a full ongoing concierge instead of a short starter preview.
          </p>
        </div>
        <PricingGrid currentTier={billing.currentTier} signedIn showActions={false} />
      </section>
    </AppShell>
  );
}

