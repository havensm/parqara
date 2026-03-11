import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";

import { getUserBillingState } from "@/lib/billing";
import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import { buildPreferenceSummary } from "@/lib/onboarding";
import type { SubscriptionTierValue } from "@/lib/contracts";
import { getDefaultParkSummary, listDashboardTrips } from "@/server/services/trip-service";
import { getOnboardingState } from "@/server/services/user-service";

import { AppShell } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/empty-state";
import { ParksUnavailableState } from "@/components/app/parks-unavailable-state";
import { PreferenceSummary } from "@/components/app/preference-summary";
import { PlanBadge } from "@/components/billing/plan-badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function AppPage() {
  const user = await requireCompletedOnboardingUser();
  const billing = getUserBillingState(user);
  const [onboarding, trips, defaultPark] = await Promise.all([
    getOnboardingState(user.id),
    listDashboardTrips(user.id),
    getDefaultParkSummary(),
  ]);
  const summaryItems = buildPreferenceSummary(onboarding.values);
  const firstName = user.firstName ?? user.name ?? "there";
  const canStartPlanning = Boolean(defaultPark);
  const nextSteps: Array<{
    href: string;
    title: string;
    detail: string;
    requiredTier?: SubscriptionTierValue;
  }> = [
    {
      href: "/dashboard",
      title: "Chat with the planner",
      detail: "Use Mara to ask follow-up questions and shape the trip with context-aware guidance.",
      requiredTier: "PRO",
    },
    {
      href: "/trips/new?fresh=1",
      title: "Plan a day trip",
      detail: "Start with a quick outing and let Parqara shape the first version of the day.",
    },
    {
      href: "/billing",
      title: "Compare plans",
      detail: "See exactly what Plus and Pro unlock before you turn on billing with Stripe.",
    },
    {
      href: "/profile",
      title: "Refine your defaults",
      detail: "Update preferences before the first plan if you want tighter recommendations.",
    },
  ];

  return (
    <AppShell
      eyebrow="Parqara app"
      title={`Welcome back, ${firstName}.`}
      description="Your profile is ready. Start the first adventure when you are ready and Parqara will carry your saved defaults into the planning flow."
      actionHref={canStartPlanning ? "/trips/new?fresh=1" : undefined}
      actionLabel={canStartPlanning ? "Start your first adventure" : undefined}
    >
      <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <PreferenceSummary items={summaryItems.length ? summaryItems : ["Your defaults are saved and ready for your first plan"]} />

        {canStartPlanning ? (
          <Card className="p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Next steps</p>
            <div className="mt-5 grid gap-3">
              {nextSteps.map((item) => (
                <Link key={item.title} href={item.href} className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 transition hover:border-[#c9d8d1] hover:bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">{item.title}</p>
                        {item.requiredTier ? <PlanBadge tier={item.requiredTier} /> : null}
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-500">{item.detail}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Catalog status</p>
            <h2 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
              No parks are configured for production yet.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              The account and planner shell are ready, but trip creation stays unavailable until at least one real park catalog is loaded into the database.
            </p>
          </Card>
        )}
      </div>

      {trips.length ? (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {trips.slice(0, 3).map((trip) => (
            <Card key={trip.id} className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{trip.status}</p>
              <h2 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">{trip.name}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{trip.latestPlanSummary ?? "Open this adventure to continue where you left off."}</p>
              <div className="mt-6 flex gap-3">
                <Link href={trip.status === "DRAFT" ? `/trips/new?tripId=${trip.id}` : `/trips/${trip.id}`} className={buttonStyles({ variant: "secondary", size: "default" })}>
                  Open
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : canStartPlanning ? (
        <EmptyState
          eyebrow="No adventures yet"
          title="You haven&apos;t planned an adventure yet."
          description="Start with one outing and Parqara will use your saved defaults to make the flow feel much lighter from the first question."
          actionHref="/dashboard"
          actionLabel="Talk to the planner"
          visual={
            <div className="flex h-36 w-36 items-center justify-center rounded-[36px] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.2),transparent_60%),linear-gradient(180deg,#f7fbff_0%,#eef6fb_100%)] text-teal-700">
              <Compass className="h-12 w-12" />
            </div>
          }
        />
      ) : (
        <ParksUnavailableState />
      )}

      <Card className="p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Current plan</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">{billing.currentPlan.name}</h2>
              <PlanBadge tier={billing.currentTier} />
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Free keeps the core planner open. Plus adds live park mode, while Pro unlocks Mara and collaboration.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/profile" className={buttonStyles({ variant: "secondary", size: "lg" })}>
              <Sparkles className="mr-2 h-4 w-4" />
              Open profile
            </Link>
            <Link href="/billing" className={buttonStyles({ variant: "ghost", size: "lg" })}>
              View plans
            </Link>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
