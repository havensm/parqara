import Link from "next/link";
import { CalendarDays, Clock3, Lock, Route, Users2, WandSparkles, type LucideIcon } from "lucide-react";

import { BILLING_FEATURES, canAccessBillingFeature, getPlanByTier, type BillingFeatureKey } from "@/lib/billing";
import type { ParkCatalogDto, SubscriptionTierValue, TripDetailDto } from "@/lib/contracts";
import { formatTripPlannerStatusLabel } from "@/lib/trip-planner-agent";
import { cn } from "@/lib/utils";

import { TripForm } from "@/components/trip/trip-form";
import { TripPlannerSettingsDialog } from "@/components/trip/trip-planner-settings-dialog";
import { PlannerSectionKicker } from "@/components/trip/planner-section-kicker";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";

type PlannerDashboardDetailsProps = {
  currentTier: SubscriptionTierValue;
  trip: TripDetailDto;
  catalog?: ParkCatalogDto | null;
};

type CapabilityCard = {
  feature: BillingFeatureKey;
  title: string;
  detail: string;
  availableLabel: string;
  lockedDetail: string;
  icon: LucideIcon;
  href?: string;
  actionLabel?: string;
};

function formatVisitDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTimeLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getPlanSummary(trip: TripDetailDto) {
  if (trip.latestPlanSummary) {
    return trip.latestPlanSummary;
  }

  if (trip.status === "LIVE") {
    return "Live mode is running. Keep the next move, waits, and timing close.";
  }

  if (trip.status === "COMPLETED") {
    return "This planner is finished. Review the route and reuse what worked next time.";
  }

  return "The planner is ready for the next change from Mara.";
}

function getAverageWait(trip: TripDetailDto) {
  return Math.round(trip.itinerary.reduce((total, item) => total + item.predictedWaitMinutes, 0) / Math.max(trip.itinerary.length, 1));
}

function getTotalWalking(trip: TripDetailDto) {
  return trip.itinerary.reduce((total, item) => total + item.walkingMinutes, 0);
}

function getPrimaryAction(trip: TripDetailDto, currentTier: SubscriptionTierValue, upgradeHref: string) {
  if (trip.status === "COMPLETED") {
    return {
      href: `/trips/${trip.id}/summary`,
      label: "Open summary",
    };
  }

  const liveLocked = !canAccessBillingFeature(currentTier, "liveDashboard");

  if (liveLocked) {
    return {
      href: upgradeHref,
      label: "Upgrade for live mode",
    };
  }

  return {
    href: `/trips/${trip.id}/live`,
    label: "Open live mode",
  };
}

export function PlannerDashboardDetails({ currentTier, trip, catalog }: PlannerDashboardDetailsProps) {
  const upgradeHref = currentTier === "FREE" ? "/pricing" : "/billing";
  const capabilityCards: CapabilityCard[] = [
    {
      feature: "liveDashboard",
      title: "Live day-of board",
      detail:
        trip.status === "DRAFT"
          ? "Once the route is built, live mode keeps the next move, alerts, and instant replans in one place."
          : "Use the live dashboard for next moves, alerts, and on-the-ground changes once the day starts.",
      availableLabel: trip.status === "DRAFT" ? "Ready after build" : "Available on this planner",
      lockedDetail: "Unlock live mode, alerts, and replans with Plus.",
      icon: Route,
      href: trip.status === "DRAFT" || trip.status === "COMPLETED" ? undefined : `/trips/${trip.id}/live`,
      actionLabel: trip.status === "DRAFT" ? undefined : trip.status === "COMPLETED" ? undefined : "Open live mode",
    },
    {
      feature: "tripCollaboration",
      title: "Shared planning",
      detail: "Invite collaborators, keep everyone aligned, and manage access from planner settings.",
      availableLabel: "Managed in Edit planner",
      lockedDetail: "Upgrade to Pro to invite collaborators and share this planner.",
      icon: Users2,
    },
    {
      feature: "plannerTemplates",
      title: "Workflow tools",
      detail: "Duplicate planners, save templates, and review version history from the planner settings workspace.",
      availableLabel: "Managed in Edit planner",
      lockedDetail: "Upgrade to Pro for duplication, templates, and version history.",
      icon: WandSparkles,
    },
  ];

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
      <div className="min-w-0">
        {trip.status === "DRAFT" && catalog ? <TripForm catalog={catalog} initialTrip={trip} /> : <PlannerRouteSummary currentTier={currentTier} trip={trip} upgradeHref={upgradeHref} />}
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6">
        <div className="overflow-hidden rounded-[30px] border border-[var(--card-border)] bg-white shadow-[0_18px_42px_rgba(12,20,37,0.06)]">
          <div className="border-b border-[var(--card-border)] bg-[linear-gradient(180deg,#fbfdff_0%,#ffffff_100%)] px-5 py-5">
            <PlannerSectionKicker emoji="🔒" label="Planner access" tone="amber" />
            <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">Upgrade-gated tools</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Anything locked is dimmed on purpose. Upgrade links go straight to the plan screen that unlocks it.
            </p>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            {capabilityCards.map((card) => (
              <CapabilityFeatureCard
                key={card.title}
                currentTier={currentTier}
                upgradeHref={upgradeHref}
                {...card}
              />
            ))}
          </div>

          <div className="border-t border-[var(--card-border)] px-4 py-4 sm:px-5">
            <TripPlannerSettingsDialog currentTier={currentTier} tripId={trip.id} tripName={trip.name} isOwner={trip.isOwner} />
          </div>
        </div>
      </aside>
    </section>
  );
}

function PlannerRouteSummary({
  currentTier,
  trip,
  upgradeHref,
}: {
  currentTier: SubscriptionTierValue;
  trip: TripDetailDto;
  upgradeHref: string;
}) {
  const nextItem = trip.itinerary.find((item) => item.status === "PLANNED") ?? trip.itinerary[0] ?? null;
  const primaryAction = getPrimaryAction(trip, currentTier, upgradeHref);
  const liveLocked = trip.status !== "COMPLETED" && !canAccessBillingFeature(currentTier, "liveDashboard");
  const itineraryItems = trip.itinerary.slice(0, 6);

  return (
    <div className="overflow-hidden rounded-[30px] border border-[var(--card-border)] bg-white shadow-[0_18px_42px_rgba(12,20,37,0.06)]">
      <div className="border-b border-[var(--card-border)] bg-[linear-gradient(180deg,#fbfdff_0%,#ffffff_100%)] px-6 py-6 sm:px-7 sm:py-7">
        <PlannerSectionKicker emoji="🗂️" label="Planner details" tone="sky" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-[2.4rem]">
            Current plan
          </h2>
          <Badge variant="neutral">{formatTripPlannerStatusLabel(trip.status)}</Badge>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">{getPlanSummary(trip)}</p>
      </div>

      <div className="space-y-6 p-6 sm:p-7">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric label="Park" value={trip.park.name} detail={trip.park.resort} icon={Route} />
          <SummaryMetric label="Visit date" value={formatVisitDate(trip.visitDate)} detail={trip.partyProfile.startTime || "Arrival time flexible"} icon={CalendarDays} />
          <SummaryMetric label="Route stops" value={String(trip.itinerary.length)} detail={`${getAverageWait(trip)}m avg wait`} icon={Clock3} />
          <SummaryMetric label="Next move" value={nextItem ? nextItem.title : "Plan ready"} detail={nextItem ? formatTimeLabel(nextItem.startTime) : "Waiting for the next change"} icon={WandSparkles} />
        </div>

        <div className="overflow-hidden rounded-[28px] border border-[var(--card-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
          <div className="flex flex-col gap-3 border-b border-[var(--card-border)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Route snapshot</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {trip.itinerary.length ? `${getTotalWalking(trip)} minutes of walking across the current route.` : "No route has been saved yet."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href={`/trips/${trip.id}/itinerary`} className={buttonStyles({ variant: "secondary", size: "sm" })}>
                View itinerary
              </Link>
              <Link href={primaryAction.href} className={buttonStyles({ variant: liveLocked ? "accent" : "primary", size: "sm" })}>
                {primaryAction.label}
              </Link>
            </div>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            {itineraryItems.length ? (
              itineraryItems.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-[var(--card-border)] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(12,20,37,0.04)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                        <span className="rounded-full border border-[var(--card-border)] bg-[var(--surface-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                          {item.type.toLowerCase()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.reason}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      <span className="rounded-full border border-[var(--card-border)] bg-[var(--surface-muted)] px-3 py-1.5">{formatTimeLabel(item.startTime)}</span>
                      <span className="rounded-full border border-[var(--card-border)] bg-[var(--surface-muted)] px-3 py-1.5">{item.predictedWaitMinutes}m wait</span>
                      <span className="rounded-full border border-[var(--card-border)] bg-[var(--surface-muted)] px-3 py-1.5">{item.walkingMinutes}m walk</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4 text-sm text-[var(--muted)]">
                The itinerary is empty right now. Ask Mara for the next step or build the route from the saved trip details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CapabilityFeatureCard({
  currentTier,
  feature,
  title,
  detail,
  availableLabel,
  lockedDetail,
  icon: Icon,
  upgradeHref,
  href,
  actionLabel,
}: CapabilityCard & {
  currentTier: SubscriptionTierValue;
  upgradeHref: string;
}) {
  const definition = BILLING_FEATURES[feature];
  const locked = !canAccessBillingFeature(currentTier, feature);

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[var(--card-border)] bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9ff_100%)] p-4">
      <div className={cn("space-y-4", locked && "pointer-events-none select-none opacity-30 grayscale") }>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[var(--card-border)] bg-white text-[var(--teal-700)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={locked ? "warning" : "success"}>{locked ? `${getPlanByTier(definition.requiredTier).name} required` : availableLabel}</Badge>
          {href && actionLabel ? (
            <Link href={href} className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sky-700)] hover:text-[var(--foreground)]">
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </div>

      {locked ? (
        <div className="absolute inset-0 flex flex-col justify-between bg-[linear-gradient(180deg,rgba(248,250,255,0.7),rgba(255,255,255,0.94))] p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
            <Lock className="h-3.5 w-3.5" />
            {getPlanByTier(definition.requiredTier).name} feature
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Locked on {getPlanByTier(currentTier).name}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{lockedDetail}</p>
          </div>
          <Link href={upgradeHref} className={buttonStyles({ variant: "secondary", size: "sm" }) + " w-full justify-center"}>
            Go to upgrade
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function SummaryMetric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: LucideIcon }) {
  return (
    <div className="rounded-[22px] border border-[var(--card-border)] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(12,20,37,0.04)]">
      <div className="flex items-center gap-3 text-[var(--foreground)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[rgba(238,253,249,0.9)] text-[var(--teal-700)]">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
          <p className="mt-1 truncate text-sm font-semibold text-[var(--foreground)]">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{detail}</p>
    </div>
  );
}
