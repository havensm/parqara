import type { ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  MapPinned,
  Route,
} from "lucide-react";

import { canAccessBillingFeature } from "@/lib/billing";
import type { SubscriptionTierValue, TripDetailDto } from "@/lib/contracts";
import { formatTripPlannerStatusLabel } from "@/lib/trip-planner-agent";

import { PlanBadge } from "@/components/billing/plan-badge";
import { PlannerSectionKicker } from "@/components/trip/planner-section-kicker";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function getOverviewCopy(trip: TripDetailDto) {
  if (trip.latestPlanSummary) {
    return trip.latestPlanSummary;
  }

  if (trip.status === "LIVE") {
    return "Live mode is active. Keep the route and next move close.";
  }

  if (trip.status === "COMPLETED") {
    return "Finished trip. Review what worked and reuse the pattern next time.";
  }

  return "Built plan ready for live mode.";
}

function getPrimaryAction(trip: TripDetailDto) {
  if (trip.status === "LIVE") {
    return {
      href: `/trips/${trip.id}/live`,
      label: "Open live dashboard",
      title: "Keep this trip moving.",
      description: "Open live mode to adapt the day around waits and alerts.",
    };
  }

  if (trip.status === "COMPLETED") {
    return {
      href: `/trips/${trip.id}/summary`,
      label: "View summary",
      title: "Review the finished day.",
      description: "Open the summary to see what worked and what to reuse.",
    };
  }

  return {
    href: `/trips/${trip.id}/live`,
    label: "Enter live mode",
    title: "Move this trip into live mode.",
    description: "Open live mode when you arrive.",
  };
}

export function ItineraryView({ trip, currentTier }: { trip: TripDetailDto; currentTier: SubscriptionTierValue }) {
  const averageWait = Math.round(
    trip.itinerary.reduce((total, item) => total + item.predictedWaitMinutes, 0) / Math.max(trip.itinerary.length, 1)
  );
  const totalWalking = trip.itinerary.reduce((total, item) => total + item.walkingMinutes, 0);
  const diningStops = trip.itinerary.filter((item) => item.type === "DINING").length;
  const kidFriendlyStops = trip.itinerary.filter((item) => item.kidFriendly).length;
  const primaryAction = getPrimaryAction(trip);
  const breakWindow =
    trip.partyProfile.breakStart && trip.partyProfile.breakEnd
      ? `${trip.partyProfile.breakStart} to ${trip.partyProfile.breakEnd}`
      : "No break window saved";
  const requiresPlus = trip.status !== "COMPLETED";
  const liveModeLocked = requiresPlus && !canAccessBillingFeature(currentTier, "liveDashboard");
  const liveActionLabel = liveModeLocked ? "Preview live mode" : primaryAction.label;

  return (
    <Card className="p-6 sm:p-7">
      <div className="border-b border-slate-200/80 pb-5">
        <PlannerSectionKicker emoji="🗂️" label="Trip details" tone="teal" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
            At a glance
          </h2>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
            {formatTripPlannerStatusLabel(trip.status)}
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{getOverviewCopy(trip)}</p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Park" value={trip.park.name} detail={trip.park.resort} icon={<MapPinned className="h-5 w-5" />} />
        <MetricTile label="Date" value={format(new Date(trip.visitDate), "EEEE, MMM d")} detail={`${trip.partyProfile.startTime} arrival`} icon={<CalendarDays className="h-5 w-5" />} />
        <MetricTile label="Stops" value={String(trip.itinerary.length)} detail={`${diningStops} dining, ${kidFriendlyStops} kid-friendly`} icon={<Route className="h-5 w-5" />} />
        <MetricTile label="Avg wait" value={`${averageWait}m`} detail={`Estimated walking ${totalWalking}m`} icon={<Clock3 className="h-5 w-5" />} />
      </div>

      <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
        <PlannerSectionKicker emoji="⚡" label="Trip actions" tone="amber" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h3 className="text-2xl font-semibold text-slate-950">{primaryAction.title}</h3>
          {requiresPlus ? <PlanBadge tier="PLUS" /> : null}
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {liveModeLocked ? "Plus unlocks live mode, ride completions, and instant replans." : primaryAction.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/trips/${trip.id}/itinerary`} className={buttonStyles({ variant: "primary", size: "default" })}>
            View itinerary
          </Link>
          <Link href={primaryAction.href} className={buttonStyles({ variant: "secondary", size: "default" })}>
            {liveActionLabel}
          </Link>
        </div>
      </div>

      <details className="group mt-6 rounded-[28px] border border-slate-200 bg-slate-50 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <div>
            <PlannerSectionKicker emoji="🧩" label="Advanced details" tone="violet" />
            <p className="mt-2 text-sm text-slate-600">Open saved preferences.</p>
          </div>
          <ChevronDown className="h-5 w-5 text-slate-500 transition group-open:rotate-180" />
        </summary>

        <div className="border-t border-slate-200 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[26px] border border-slate-200 bg-white p-5">
              <PlannerSectionKicker emoji="🧠" label="Saved profile" tone="sky" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ProfileItem label="Thrill tolerance" value={trip.partyProfile.thrillTolerance} />
                <ProfileItem label="Walking tolerance" value={trip.partyProfile.walkingTolerance} />
                <ProfileItem label="Must-dos" value={String(trip.partyProfile.mustDoRideIds.length)} />
                <ProfileItem label="Break window" value={breakWindow} />
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-white p-5">
              <PlannerSectionKicker emoji="🍽️" label="Preference snapshot" tone="amber" />
              <div className="mt-4 space-y-4">
                <PreferenceBlock label="Preferred ride types" values={trip.partyProfile.preferredRideTypes} emptyLabel="No ride styles selected" />
                <PreferenceBlock label="Dining preferences" values={trip.partyProfile.diningPreferences} emptyLabel="No dining preferences selected" />
              </div>
            </div>
          </div>
        </div>
      </details>
    </Card>
  );
}

function MetricTile({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3 text-slate-950">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-cyan-50 text-teal-700">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function PreferenceBlock({ label, values, emptyLabel }: { label: string; values: string[]; emptyLabel: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      {values.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value} variant="neutral">
              {value.replaceAll("-", " ")}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{emptyLabel}</p>
      )}
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
