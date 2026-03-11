import Link from "next/link";

import { getBillingStatusLabel, getUserBillingState } from "@/lib/billing";
import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import { getOnboardingState } from "@/server/services/user-service";

import { AppShell } from "@/components/app/app-shell";
import { PlanBadge } from "@/components/billing/plan-badge";
import { ProfilePreferencesForm } from "@/components/profile/preferences-form";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function ProfilePage() {
  const user = await requireCompletedOnboardingUser();
  const onboarding = await getOnboardingState(user.id);
  const billing = getUserBillingState(user);

  return (
    <AppShell
      eyebrow="Profile"
      title="Your planning defaults"
      description="Update the preferences Parqara should remember for every future adventure, and review which plan is active on this account."
    >
      <Card className="p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Subscription</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
                {billing.currentPlan.name}
              </h2>
              <PlanBadge tier={billing.currentTier} />
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                {getBillingStatusLabel(user.subscriptionStatus)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Free and Plus include a short Mara starter preview. Pro adds the full Mara concierge and shared trip workspaces.
            </p>
          </div>
          <Link href="/billing" className={buttonStyles({ variant: "secondary", size: "default" })}>
            View billing
          </Link>
        </div>
      </Card>

      <ProfilePreferencesForm initialValues={onboarding.values} />
    </AppShell>
  );
}

