import Link from "next/link";
import { CreditCard } from "lucide-react";

import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import { isAdminEmail } from "@/lib/admin";
import { getBillingStatusLabel, getPlanByTier, getUserBillingState } from "@/lib/billing";
import { isStripeBillingConfigured } from "@/lib/billing-env";
import { BILLING_PORTAL_HREF, getBillingCheckoutHref, getBillingNotice } from "@/lib/billing-links";
import { getPlannerLimitState } from "@/server/services/planner-entitlement-service";
import { listPlannerTemplates } from "@/server/services/trip-service";

import { AppShell } from "@/components/app/app-shell";
import { PlanBadge } from "@/components/billing/plan-badge";
import { PricingGrid } from "@/components/billing/pricing-grid";
import { PlannerLimitCard } from "@/components/trip/planner-limit-card";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; tier?: string }>;
}) {
  const user = await requireCompletedOnboardingUser();
  const adminEnabled = isAdminEmail(user.email);
  const billing = getUserBillingState(user);
  const billingStatusLabel = getBillingStatusLabel(user.subscriptionStatus);
  const plannerLimitState = await getPlannerLimitState(user.id);
  const savedTemplates = billing.featureAccess.plannerTemplates ? await listPlannerTemplates(user.id) : [];
  const stripeConfigured = isStripeBillingConfigured();
  const params = await searchParams;
  const notice = getBillingNotice(params.billing, params.tier);
  const nextUpgradeTier = billing.currentTier === "FREE" ? "PLUS" : billing.currentTier === "PLUS" ? "PRO" : null;
  const nextUpgradePlan = nextUpgradeTier ? getPlanByTier(nextUpgradeTier) : null;
  const workflowSummary =
    billing.currentTier === "PRO"
      ? billing.featureAccess.plannerTemplates
        ? `${savedTemplates.length} template${savedTemplates.length === 1 ? "" : "s"} saved, plus duplication, version history, and collaboration.`
        : "Templates, duplication, version history, and collaboration are included on Pro."
      : billing.currentTier === "PLUS"
        ? "Live mode, replans, and more room are included."
        : "Full Mara is included, with room for one active planner.";

  return (
    <AppShell
      eyebrow="Billing and plans"
      title="Keep billing clear and easy to manage."
      description="One place for your current plan, upgrade path, and plan comparison without the extra dashboard clutter."
      actionHref={BILLING_PORTAL_HREF}
      actionLabel="Manage billing"
      icon={<CreditCard className="h-6 w-6" />}
      currentTier={billing.currentTier}
      adminEnabled={adminEnabled}
    >
      {notice ? (
        <Card tone="solid" className="overflow-hidden p-0">
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card tone="solid" className="overflow-hidden p-0">
          <div className="border-b border-[var(--card-border)] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-6 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Current plan</p>
                <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{billing.currentPlan.name}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <PlanBadge tier={billing.currentTier} />
                <span className="text-sm font-medium text-[var(--muted)]">{billingStatusLabel}</span>
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">{billing.currentPlan.summary}</p>
          </div>

          <div className="divide-y divide-[var(--card-border)]">
            <BillingRow label="Mara access" value="Included" detail="Full planning and revisions are open on every plan." />
            <BillingRow label="Active planners" value={`${plannerLimitState.activePlannerCount} / ${plannerLimitState.plannerLimit}`} detail={`${plannerLimitState.archivedTrips.length} archived planners saved outside the active limit.`} />
            <BillingRow label="Workflow tools" value={billing.currentTier === "PRO" ? "Advanced" : billing.currentTier === "PLUS" ? "Core premium" : "Starter"} detail={workflowSummary} />

            <div className="px-6 py-6 sm:px-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Next best move</p>
              <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {nextUpgradePlan ? `Move to ${nextUpgradePlan.name} when you need more room.` : "You are already on the highest plan."}
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                {nextUpgradePlan
                  ? nextUpgradePlan.summary
                  : "Pro already includes the higher-volume workflow tools: duplication, templates, version history, and collaborator access."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {nextUpgradePlan ? (
                  <Link href={getBillingCheckoutHref(nextUpgradeTier!)} className={buttonStyles({ variant: "primary", size: "default" })}>
                    Upgrade to {nextUpgradePlan.name}
                  </Link>
                ) : null}
                <Link href="/pricing" className={buttonStyles({ variant: "secondary", size: "default" })}>
                  Compare plans
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <Card tone="solid" className="p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Billing actions</p>
          <div className="mt-5 flex flex-col gap-3">
            <Link href={BILLING_PORTAL_HREF} className={buttonStyles({ variant: "primary", size: "default" }) + " w-full justify-center"}>
              Manage billing
            </Link>
            {nextUpgradePlan ? (
              <Link href={getBillingCheckoutHref(nextUpgradeTier!)} className={buttonStyles({ variant: "secondary", size: "default" }) + " w-full justify-center"}>
                Upgrade to {nextUpgradePlan.name}
              </Link>
            ) : null}
            <Link href="/profile" className={buttonStyles({ variant: "ghost", size: "default" }) + " w-full justify-center"}>
              Back to profile
            </Link>
          </div>
          <div className="mt-6 space-y-3 text-sm leading-6 text-[var(--muted)]">
            <p>Status: {billingStatusLabel}</p>
            <p>{stripeConfigured ? "Stripe is configured for this environment." : "Stripe keys and price IDs still need to be configured for live billing."}</p>
          </div>
        </Card>
      </div>

      {!plannerLimitState.canCreate ? (
        <PlannerLimitCard
          limitState={plannerLimitState}
          title="You have reached your active planner limit."
          detail="Archive an existing planner or move up a tier to open another active workspace. Archived planners stay saved and can be restored later."
        />
      ) : null}

      <section className="space-y-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Plan comparison</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Compare Free, Plus, and Pro.
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Choose the amount of planner room and workflow depth you actually need.
          </p>
        </div>

        {!stripeConfigured ? (
          <Card tone="solid" className="overflow-hidden p-0">
            <div className="bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_100%)] px-6 py-6 sm:px-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--amber-700)]">Stripe status</p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Stripe checkout is not live yet.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                Add live Stripe keys, price IDs, and the final session creation logic to turn on real upgrades and billing management.
              </p>
            </div>
          </Card>
        ) : null}

        <PricingGrid currentTier={billing.currentTier} signedIn />
      </section>
    </AppShell>
  );
}

function BillingRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7">
      <div>
        <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{detail}</p>
      </div>
      <p className="text-sm font-semibold text-[var(--foreground)] sm:text-right">{value}</p>
    </div>
  );
}



