import Link from "next/link";
import { HeartHandshake, Settings2, Sparkles, Users } from "lucide-react";

import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import { getBillingStatusLabel, getUserBillingState } from "@/lib/billing";
import { isStripeBillingConfigured } from "@/lib/billing-env";
import { getOnboardingState } from "@/server/services/user-service";

import { AppShell } from "@/components/app/app-shell";
import { PlanBadge } from "@/components/billing/plan-badge";
import { PricingGrid } from "@/components/billing/pricing-grid";
import { ProfilePeopleManager } from "@/components/profile/profile-people-manager";
import { ProfilePreferencesForm } from "@/components/profile/preferences-form";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function ProfilePage() {
  const user = await requireCompletedOnboardingUser();
  const onboarding = await getOnboardingState(user.id);
  const billing = getUserBillingState(user);
  const billingStatusLabel = getBillingStatusLabel(user.subscriptionStatus);
  const stripeConfigured = isStripeBillingConfigured();
  const showBillingStatus = ![billing.currentPlan.name.toLowerCase(), billing.currentTier.toLowerCase()].includes(
    billingStatusLabel.toLowerCase()
  );

  return (
    <AppShell
      eyebrow="Profile"
      title="Your defaults"
      description="Save defaults and manage your plan in one place."
      icon={<Settings2 className="h-6 w-6" />}
      highlights={[
        { icon: <HeartHandshake className="h-4 w-4" />, label: "Preferences carry forward" },
        { icon: <Users className="h-4 w-4" />, label: "Party needs stay saved" },
        { icon: <Sparkles className="h-4 w-4" />, label: "Billing lives here now" },
      ]}

    >
      <Card className="overflow-hidden p-0">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),linear-gradient(180deg,rgba(248,252,255,0.98),rgba(255,255,255,0.98))] px-6 py-6 sm:px-7">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Subscription</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
              {billing.currentPlan.name}
            </h2>
            <PlanBadge tier={billing.currentTier} />
            {showBillingStatus ? (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                {billingStatusLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Free and Plus include a Mara preview. Pro adds full Mara and sharing.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/profile#billing" className={buttonStyles({ variant: "secondary", size: "default" })}>
              Compare plans
            </Link>
          </div>
        </div>
      </Card>

      <ProfilePeopleManager />

      <section id="billing" className="scroll-mt-28 space-y-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Plans</p>
          <h2 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Compare plans.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">Plus is for live execution. Pro unlocks full Mara.</p>
        </div>

        {!stripeConfigured ? (
          <Card className="overflow-hidden p-0">
            <div className="bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_28%),linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,255,255,0.98))] px-6 py-6 sm:px-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700/80">Stripe status</p>
              <h2 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
                Stripe checkout is not live yet.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Add live Stripe keys and price IDs to turn on upgrades.
              </p>
            </div>
          </Card>
        ) : null}

        <PricingGrid currentTier={billing.currentTier} signedIn showActions={false} />
      </section>

      <ProfilePreferencesForm initialValues={onboarding.values} />
    </AppShell>
  );
}


