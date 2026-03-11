import type { ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Footprints,
  MapPinned,
  Route,
  Sparkles,
} from "lucide-react";

import { canAccessBillingFeature } from "@/lib/billing";
import type { SubscriptionTierValue, TripDetailDto } from "@/lib/contracts";
import { formatTripPlannerStatusLabel } from "@/lib/trip-planner-agent";

import { PlanBadge } from "@/components/billing/plan-badge";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function getOverviewCopy(trip: TripDetailDto) {
  if (trip.latestPlanSummary) {
    return trip.latestPlanSummary;
  }

  if (trip.status === "LIVE") {
    return "This trip is already in motion. Keep the saved route close and let Mara pressure-test the next decisions against the live day.";
  }

  if (trip.status === "COMPLETED") {
    return "This outing is complete. Review the final route, pacing, and takeaways before you reuse the pattern on the next trip.";
  }

  return "This itinerary is ready to review before you move into live mode.";
}

function getPrimaryAction(trip: TripDetailDto) {
  if (trip.status === "LIVE") {
    return {
      href: `/trips/${trip.id}/live`,
      label: "Open live dashboard",
      supportingHref: "/trips/new?fresh=1",
      supportingLabel: "Plan another trip",
      title: "Keep this trip moving in live mode.",
      description: "Open the live dashboard to keep adapting the day around current waits, alerts, and timing changes.",
    };
  }

  if (trip.status === "COMPLETED") {
    return {
      href: `/trips/${trip.id}/summary`,
      label: "View summary",
      supportingHref: "/trips/new?fresh=1",
      supportingLabel: "Plan another trip",
      title: "Review the finished day.",
      description: "Open the summary to review what worked, what changed, and what to reuse on the next outing.",
    };
  }

  return {
    href: `/trips/${trip.id}/live`,
    label: "Enter live mode",
    supportingHref: "/trips/new?fresh=1",
    supportingLabel: "Plan another trip",
    title: "Move this trip into live mode when you arrive.",
    description: "The itinerary is already built with reasoning, predicted waits, and routing assumptions. Live mode adapts that structure as conditions change.",
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
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Trip details</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
            At a glance
          </h2>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
            {formatTripPlannerStatusLabel(trip.status)}
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{getOverviewCopy(trip)}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricTile label="Park" value={trip.park.name} detail={trip.park.resort} icon={<MapPinned className="h-5 w-5" />} />
        <MetricTile label="Trip date" value={format(new Date(trip.visitDate), "EEEE, MMM d")} detail={`${trip.partyProfile.startTime} arrival`} icon={<CalendarDays className="h-5 w-5" />} />
        <MetricTile label="Group" value={`${trip.partyProfile.partySize} guests`} detail={trip.partyProfile.kidsAges.length ? `Kids ages ${trip.partyProfile.kidsAges.join(", ")}` : "No kids ages saved"} icon={<Sparkles className="h-5 w-5" />} />
        <MetricTile label="Planned stops" value={String(trip.itinerary.length)} detail={`${diningStops} dining stops, ${kidFriendlyStops} kid-friendly`} icon={<Route className="h-5 w-5" />} />
        <MetricTile label="Avg wait" value={`${averageWait}m`} detail={`Estimated walking ${totalWalking}m`} icon={<Clock3 className="h-5 w-5" />} />
        <MetricTile label="Planning profile" value={`${trip.partyProfile.thrillTolerance.toLowerCase()} thrill`} detail={`${trip.partyProfile.walkingTolerance.toLowerCase()} walking tolerance`} icon={<Footprints className="h-5 w-5" />} />
      </div>

      <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Trip actions</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h3 className="text-2xl font-semibold text-slate-950">{primaryAction.title}</h3>
          {requiresPlus ? <PlanBadge tier="PLUS" /> : null}
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-600">{primaryAction.description}</p>
        {liveModeLocked ? (
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Upgrade to Plus to unlock the live dashboard, ride completions, and instant replans during the day.
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/trips/${trip.id}/itinerary`} className={buttonStyles({ variant: "primary", size: "default" })}>
            View itinerary
          </Link>
          <Link href={primaryAction.href} className={buttonStyles({ variant: "secondary", size: "default" })}>
            {liveActionLabel}
          </Link>
          <Link href={primaryAction.supportingHref} className={buttonStyles({ variant: "ghost", size: "default" })}>
            {primaryAction.supportingLabel}
          </Link>
        </div>
      </div>

      <details className="group mt-6 rounded-[28px] border border-slate-200 bg-slate-50 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Advanced details</p>
            <p className="mt-2 text-sm text-slate-600">Open the saved profile and preference details behind this trip.</p>
          </div>
          <ChevronDown className="h-5 w-5 text-slate-500 transition group-open:rotate-180" />
        </summary>

        <div className="border-t border-slate-200 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[26px] border border-slate-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Saved profile</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ProfileItem label="Thrill tolerance" value={trip.partyProfile.thrillTolerance} />
                <ProfileItem label="Walking tolerance" value={trip.partyProfile.walkingTolerance} />
                <ProfileItem label="Must-dos" value={String(trip.partyProfile.mustDoRideIds.length)} />
                <ProfileItem label="Break window" value={breakWindow} />
              </div>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Preference snapshot</p>
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
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3 text-slate-950">
        <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-cyan-50 text-teal-700">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
          <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-600">{detail}</p>
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
