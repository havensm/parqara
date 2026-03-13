import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bot, CalendarRange, Compass, Map, Route, Sparkles, Users, type LucideIcon } from "lucide-react";

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

type StepCard = {
  href: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  iconClassName: string;
  surfaceClassName: string;
  requiredTier?: SubscriptionTierValue;
};

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
  const nextSteps: StepCard[] = [
    {
      href: "/dashboard",
      title: "Shape the trip with Mara",
      detail: "Use chat to fill gaps and sharpen the plan.",
      icon: Bot,
      iconClassName: "bg-sky-100 text-sky-700",
      surfaceClassName: "bg-[linear-gradient(180deg,#f1f8ff_0%,#ffffff_100%)]",
      requiredTier: "PRO",
    },
    {
      href: "/trips/new?fresh=1",
      title: "Build a day plan",
      detail: "Turn saved defaults into a first route.",
      icon: Route,
      iconClassName: "bg-teal-100 text-teal-700",
      surfaceClassName: "bg-[linear-gradient(180deg,#f1fbf8_0%,#ffffff_100%)]",
    },
    {
      href: "/profile#billing",
      title: "Compare Plus and Pro",
      detail: "See when live tools and full Mara make sense.",
      icon: Sparkles,
      iconClassName: "bg-amber-100 text-amber-700",
      surfaceClassName: "bg-[linear-gradient(180deg,#fff9ef_0%,#ffffff_100%)]",
    },
    {
      href: "/profile",
      title: "Refine saved defaults",
      detail: "Update pace, party needs, and planning style.",
      icon: Users,
      iconClassName: "bg-violet-100 text-violet-700",
      surfaceClassName: "bg-[linear-gradient(180deg,#f7f2ff_0%,#ffffff_100%)]",
    },
  ];

  return (
    <AppShell
      eyebrow="Parqara app"
      title={`Welcome back, ${firstName}.`}
      description="Keep trips, preferences, and planning in one place."
      actionHref={canStartPlanning ? "/trips/new?fresh=1" : undefined}
      actionLabel={canStartPlanning ? "Start a new trip" : undefined}
      icon={<Compass className="h-6 w-6" />}
      highlights={[
        { icon: <Map className="h-4 w-4" />, label: "Trips, details, and must-dos" },
        { icon: <CalendarRange className="h-4 w-4" />, label: "Saved defaults" },
        { icon: <Sparkles className="h-4 w-4" />, label: "Mara for kickoff" },
      ]}
      visual={
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white">
            <Image
              src="/illustrations/park-planning-studio.svg"
              alt="Parqara planning workspace illustration"
              width={1200}
              height={900}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="grid gap-3">
            <VisualSummaryCard
              icon={Map}
              title="Saved profile"
              detail="Preferences stay with every trip."
              iconClassName="bg-teal-100 text-teal-700"
            />
            <VisualSummaryCard
              icon={Route}
              title="Practical plan"
              detail="Go from idea to route faster."
              iconClassName="bg-sky-100 text-sky-700"
            />
            <VisualSummaryCard
              icon={Bot}
              title="Guided kickoff"
              detail="Mara fills the gaps."
              iconClassName="bg-amber-100 text-amber-700"
            />
          </div>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.03fr_0.97fr]">
        <PreferenceSummary items={summaryItems.length ? summaryItems : ["Your defaults are saved and ready for your first plan"]} />

        {canStartPlanning ? (
          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32%),linear-gradient(180deg,rgba(248,252,255,0.98),rgba(255,255,255,0.98))] px-6 py-6 sm:px-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Next steps</p>
              <h2 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
                Pick the next step.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Move from brief to plan.
              </p>
            </div>
            <div className="grid gap-3 p-6 sm:p-7">
              {nextSteps.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`rounded-[26px] border border-slate-200 px-5 py-5 transition hover:-translate-y-0.5 hover:border-[#c9d8d1] hover:shadow-[0_18px_30px_rgba(15,23,42,0.05)] ${item.surfaceClassName}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${item.iconClassName}`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">{item.title}</p>
                          {item.requiredTier ? <PlanBadge tier={item.requiredTier} /> : null}
                        </div>
                        <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">{item.detail}</p>
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_30%),linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,255,255,0.98))] px-6 py-6 sm:px-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700/80">Catalog status</p>
              <h2 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
                No parks are configured for production yet.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Trip creation stays off until one park catalog is loaded.
              </p>
            </div>
            <div className="p-6 sm:p-7">
              <Image
                src="/illustrations/trip-summary-preview.svg"
                alt="Trip summary preview illustration"
                width={1200}
                height={900}
                className="h-auto w-full rounded-[24px] border border-slate-200 bg-white object-cover"
              />
            </div>
          </Card>
        )}
      </div>

      {trips.length ? (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {trips.slice(0, 3).map((trip, index) => (
            <Card key={trip.id} className="overflow-hidden p-0">
              <div className={`h-1.5 ${index % 3 === 0 ? "bg-teal-400" : index % 3 === 1 ? "bg-sky-400" : "bg-amber-400"}`} />
              <div className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{trip.status}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Continue trip</span>
                </div>
                <h2 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">{trip.name}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{trip.latestPlanSummary ?? "Open to keep going."}</p>
                <div className="mt-6 flex gap-3">
                  <Link href={trip.status === "DRAFT" ? `/trips/new?tripId=${trip.id}` : `/trips/${trip.id}`} className={buttonStyles({ variant: "secondary", size: "default" })}>
                    Open
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : canStartPlanning ? (
        <EmptyState
          eyebrow="No adventures yet"
          title="You haven&apos;t planned an adventure yet."
          description="Start one trip and let Parqara carry the setup."
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

      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_26%),linear-gradient(180deg,rgba(248,252,255,0.98),rgba(255,255,255,0.98))] px-6 py-6 sm:px-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Current plan</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">{billing.currentPlan.name}</h2>
              <PlanBadge tier={billing.currentTier} />
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Free covers the planner. Plus adds live tools. Pro adds full Mara and collaboration.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/profile" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                <Sparkles className="mr-2 h-4 w-4" />
                Open profile
              </Link>
              <Link href="/profile#billing" className={buttonStyles({ variant: "ghost", size: "lg" })}>
                View plans
              </Link>
            </div>
          </div>
          <div className="grid gap-3 bg-white px-6 py-6 sm:px-7">
            <PlanFeaturePill label="Free" detail="Planner and Mara preview" tone="teal" />
            <PlanFeaturePill label="Plus" detail="Live mode and replans" tone="sky" />
            <PlanFeaturePill label="Pro" detail="Full Mara and collaboration" tone="amber" />
          </div>
        </div>
      </Card>
    </AppShell>
  );
}

function VisualSummaryCard({
  icon: Icon,
  title,
  detail,
  iconClassName,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  iconClassName: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] ${iconClassName}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function PlanFeaturePill({
  label,
  detail,
  tone,
}: {
  label: string;
  detail: string;
  tone: "amber" | "sky" | "teal";
}) {
  const toneClassNames = {
    amber: "bg-[linear-gradient(180deg,#fff8eb_0%,#ffffff_100%)] text-amber-700",
    sky: "bg-[linear-gradient(180deg,#f2f8ff_0%,#ffffff_100%)] text-sky-700",
    teal: "bg-[linear-gradient(180deg,#effbf8_0%,#ffffff_100%)] text-teal-700",
  } as const;

  return (
    <div className={`rounded-[24px] border border-slate-200 px-5 py-5 ${toneClassNames[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em]">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-950">{detail}</p>
    </div>
  );
}



















