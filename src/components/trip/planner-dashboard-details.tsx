import Link from "next/link";
import { CalendarDays, Route, Users2, WandSparkles, type LucideIcon } from "lucide-react";

import { canAccessBillingFeature } from "@/lib/billing";
import type { ParkCatalogDto, SubscriptionTierValue, TripDetailDto } from "@/lib/contracts";

import { TripForm } from "@/components/trip/trip-form";
import { buttonStyles } from "@/components/ui/button";

type PlannerDashboardDetailsProps = {
  currentTier: SubscriptionTierValue;
  trip: TripDetailDto;
  catalog?: ParkCatalogDto | null;
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

function getAverageWait(trip: TripDetailDto) {
  return Math.round(trip.itinerary.reduce((total, item) => total + item.predictedWaitMinutes, 0) / Math.max(trip.itinerary.length, 1));
}

function getGroupSummary(trip: TripDetailDto) {
  const kids = trip.partyProfile.kidsAges.length ? `, kids ${trip.partyProfile.kidsAges.join(", ")}` : "";
  return `${trip.partyProfile.partySize} ${trip.partyProfile.partySize === 1 ? "guest" : "guests"}${kids}`;
}

function getDiningSummary(trip: TripDetailDto) {
  if (!trip.partyProfile.diningPreferences.length) {
    return "No food preferences saved";
  }

  return trip.partyProfile.diningPreferences.map((value) => value.replaceAll("-", " ")).slice(0, 2).join(" · ");
}

function getPrimaryAction(trip: TripDetailDto, currentTier: SubscriptionTierValue, upgradeHref: string) {
  if (trip.status === "COMPLETED") {
    return {
      href: `/trips/${trip.id}/summary`,
      label: "Open summary",
      locked: false,
    };
  }

  if (!canAccessBillingFeature(currentTier, "liveDashboard")) {
    return {
      href: upgradeHref,
      label: "Upgrade for live mode",
      locked: true,
    };
  }

  return {
    href: `/trips/${trip.id}/live`,
    label: "Open live mode",
    locked: false,
  };
}

function DetailBlock({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-[var(--teal-700)] shadow-[0_8px_18px_rgba(12,20,37,0.05)]">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{value}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function LockedLiveNotice({ href, message }: { href: string; message: string }) {
  return (
    <div className="rounded-[28px] border border-[rgba(244,182,73,0.14)] bg-[linear-gradient(135deg,rgba(255,250,242,0.98),rgba(255,253,249,0.94))] px-5 py-4 text-sm text-[var(--amber-700)] shadow-[0_8px_20px_rgba(244,182,73,0.06)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-6">{message}</p>
        <Link href={href} className="font-semibold text-[var(--amber-700)] transition hover:text-[#9b640e]">
          Upgrade
        </Link>
      </div>
    </div>
  );
}

export function PlannerDashboardDetails({ currentTier, trip, catalog }: PlannerDashboardDetailsProps) {
  const upgradeHref = currentTier === "FREE" ? "/pricing" : "/billing";
  const primaryAction = getPrimaryAction(trip, currentTier, upgradeHref);
  const nextItem = trip.itinerary.find((item) => item.status === "PLANNED") ?? trip.itinerary[0] ?? null;
  const routePreview = trip.itinerary.slice(0, 4);
  const liveLocked = primaryAction.locked;

  if (trip.status === "DRAFT" && catalog) {
    return (
      <div className="space-y-4">
        <TripForm catalog={catalog} initialTrip={trip} />

        {liveLocked ? <LockedLiveNotice href={upgradeHref} message="Live mode opens on Plus." /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[30px] border border-[var(--card-border)] bg-white shadow-[0_18px_40px_rgba(12,20,37,0.05)]">
        <div className="flex flex-col gap-4 border-b border-[var(--card-border)] px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Plan details</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-[2.15rem]">
              Saved details.
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">Mara uses these when shaping the day.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/trips/${trip.id}/itinerary`} className={buttonStyles({ variant: "secondary", size: "sm" })}>
              View itinerary
            </Link>
            <Link href={primaryAction.href} className={buttonStyles({ variant: liveLocked ? "accent" : "primary", size: "sm" })}>
              {primaryAction.label}
            </Link>
          </div>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4 sm:p-6">
          <DetailBlock
            label="When"
            value={`${formatVisitDate(trip.visitDate)} at ${trip.partyProfile.startTime}`}
            detail={trip.partyProfile.breakStart && trip.partyProfile.breakEnd ? `Break ${trip.partyProfile.breakStart}-${trip.partyProfile.breakEnd}` : "No break saved"}
            icon={CalendarDays}
          />
          <DetailBlock
            label="Who"
            value={getGroupSummary(trip)}
            detail={`Walking: ${trip.partyProfile.walkingTolerance.toLowerCase()}`}
            icon={Users2}
          />
          <DetailBlock
            label="Food"
            value={getDiningSummary(trip)}
            detail={trip.partyProfile.mustDoRideIds.length ? `${trip.partyProfile.mustDoRideIds.length} must-dos saved` : "Must-dos still open"}
            icon={WandSparkles}
          />
          <DetailBlock
            label="Route"
            value={`${trip.itinerary.length} stops`}
            detail={`${getAverageWait(trip)}m average wait`}
            icon={Route}
          />
        </div>

        <div className="border-t border-[var(--card-border)] px-5 py-5 sm:px-6 sm:py-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Route preview</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{nextItem ? `Next: ${nextItem.title}` : "No route yet."}</p>
          </div>

          <div className="mt-4 space-y-2.5">
            {routePreview.length ? (
              routePreview.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 rounded-[20px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.reason}</p>
                  </div>
                  <div className="shrink-0 text-sm text-[var(--muted)] sm:text-right">
                    <p>{formatTimeLabel(item.startTime)}</p>
                    <p className="mt-1">{item.predictedWaitMinutes}m wait · {item.walkingMinutes}m walk</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                No route yet. Ask Mara to sketch the day.
              </div>
            )}
          </div>
        </div>
      </div>

      {liveLocked ? <LockedLiveNotice href={upgradeHref} message="Live mode is on Plus." /> : null}
    </div>
  );
}
