import Link from "next/link";
import { Settings2, Sparkles, Users } from "lucide-react";

import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import { isAdminEmail } from "@/lib/admin";
import { getBillingStatusLabel, getPlanByTier, getUserBillingState } from "@/lib/billing";
import { getBillingCheckoutHref, getBillingNotice } from "@/lib/billing-links";
import { getPlannerLimitState } from "@/server/services/planner-entitlement-service";
import { getOnboardingState } from "@/server/services/user-service";

import { AppShell } from "@/components/app/app-shell";
import { PlanBadge } from "@/components/billing/plan-badge";
import { ProfilePeopleManager } from "@/components/profile/profile-people-manager";
import { ProfilePreferencesForm } from "@/components/profile/preferences-form";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; tier?: string }>;
}) {
  const user = await requireCompletedOnboardingUser();
  const adminEnabled = isAdminEmail(user.email);
  const onboarding = await getOnboardingState(user.id);
  const billing = getUserBillingState(user);
  const billingStatusLabel = getBillingStatusLabel(user.subscriptionStatus);
  const plannerLimitState = await getPlannerLimitState(user.id);
  const params = await searchParams;
  const notice = getBillingNotice(params.billing, params.tier);
  const nextUpgradeTier = billing.currentTier === "FREE" ? "PLUS" : billing.currentTier === "PLUS" ? "PRO" : null;
  const nextUpgradePlan = nextUpgradeTier ? getPlanByTier(nextUpgradeTier) : null;
  const maraAccessLabel = billing.featureAccess.aiConcierge ? "Unlimited" : "1 preview";

  return (
    <AppShell
      eyebrow="Account settings"
      title="Your profile and planning defaults."
      actionHref="/billing"
      actionLabel="Open billing"
      secondaryActionHref="/dashboard"
      secondaryActionLabel="Back to planners"
      icon={<Settings2 className="h-6 w-6" />}
      currentTier={billing.currentTier}
      adminEnabled={adminEnabled}
      highlights={[
        { icon: <Users className="h-4 w-4" />, label: `${plannerLimitState.activePlannerCount}/${plannerLimitState.plannerLimit} active planners` },
        { icon: <Sparkles className="h-4 w-4" />, label: billing.featureAccess.aiConcierge ? "Unlimited Mara unlocked" : "Free Mara preview included" },
      ]}
    >
      {notice ? (
        <Card className="overflow-hidden p-0">
          <div className={`px-6 py-6 sm:px-7 ${notice.tone === "amber" ? "bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_100%)]" : "bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)]"}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${notice.tone === "amber" ? "text-[var(--amber-700)]" : "text-[var(--sky-700)]"}`}>
              Billing update
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              {notice.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">{notice.detail}</p>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <ProfilePreferencesForm
          initialValues={onboarding.values}
          initialProfileImageDataUrl={user.profileImageDataUrl ?? null}
          userEmail={user.email}
        />

        <div className="space-y-6">
          <Card className="p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Plan and access</p>
                <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{billing.currentPlan.name}</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">{billingStatusLabel}</p>
              </div>
              <PlanBadge tier={billing.currentTier} />
            </div>

            <div className="mt-5 space-y-3">
              <SummaryRow label="Mara" value={maraAccessLabel} />
              <SummaryRow label="Active planners" value={`${plannerLimitState.activePlannerCount}/${plannerLimitState.plannerLimit}`} />
              <SummaryRow label="Archived planners" value={`${plannerLimitState.archivedTrips.length}`} />
            </div>

            <div className={`mt-5 rounded-[22px] border px-4 py-4 text-sm leading-6 ${plannerLimitState.canCreate ? "border-[var(--card-border)] bg-[var(--surface-muted)] text-[var(--muted)]" : "border-[rgba(244,182,73,0.28)] bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_100%)] text-[var(--amber-700)]"}`}>
              {plannerLimitState.canCreate
                ? "You still have room for another active planner."
                : "You are at your active planner limit. Archive one or upgrade for more room."}
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              <Link href="/billing" className={buttonStyles({ variant: "primary", size: "default" }) + " w-full justify-center"}>
                Open billing
              </Link>
              {nextUpgradePlan ? (
                <Link href={getBillingCheckoutHref(nextUpgradeTier!)} className={buttonStyles({ variant: "secondary", size: "default" }) + " w-full justify-center"}>
                  Upgrade to {nextUpgradePlan.name}
                </Link>
              ) : (
                <Link href="/pricing" className={buttonStyles({ variant: "secondary", size: "default" }) + " w-full justify-center"}>
                  View pricing
                </Link>
              )}
            </div>
          </Card>

          <ProfilePeopleManager />
        </div>
      </div>
    </AppShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-3">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
