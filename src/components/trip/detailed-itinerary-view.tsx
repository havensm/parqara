import type { ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarDays,
  MapPinned,
  Route,
  Sparkles,
} from "lucide-react";

import type { TripDetailDto } from "@/lib/contracts";
import { generatedVisuals } from "@/lib/generated-assets";
import { formatTripPlannerStatusLabel } from "@/lib/trip-planner-agent";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VisualShowcase } from "@/components/ui/visual-showcase";

function getOverviewCopy(trip: TripDetailDto) {
  if (trip.latestPlanSummary) {
    return trip.latestPlanSummary;
  }

  if (trip.status === "LIVE") {
    return "This trip is already in motion. Review the ordered route, timing, and stop logic here while the live dashboard handles real-time changes.";
  }

  if (trip.status === "COMPLETED") {
    return "This outing is complete. Use the itinerary to review what the route was designed to do before comparing it with the final summary.";
  }

  return "This is the detailed version of the trip plan, with the full route, timing, and decision context attached to each stop.";
}

function getPrimaryAction(trip: TripDetailDto) {
  if (trip.status === "LIVE") {
    return {
      href: `/trips/${trip.id}/live`,
      label: "Open live dashboard",
      title: "Keep this trip moving in live mode.",
      description: "Use the live dashboard when current waits and conditions matter more than the static route.",
    };
  }

  if (trip.status === "COMPLETED") {
    return {
      href: `/trips/${trip.id}/summary`,
      label: "View summary",
      title: "Review the finished day.",
      description: "Open the summary to compare the route with what actually happened.",
    };
  }

  return {
    href: `/trips/${trip.id}/live`,
    label: "Enter live mode",
    title: "Move this trip into live mode when you arrive.",
    description: "The itinerary is already built. Use live mode when the park day starts so the plan can adapt in real time.",
  };
}

export function DetailedItineraryView({ trip }: { trip: TripDetailDto }) {
  const averageWait = Math.round(
    trip.itinerary.reduce((total, item) => total + item.predictedWaitMinutes, 0) / Math.max(trip.itinerary.length, 1)
  );
  const totalWalking = trip.itinerary.reduce((total, item) => total + item.walkingMinutes, 0);
  const diningStops = trip.itinerary.filter((item) => item.type === "DINING").length;
  const kidFriendlyStops = trip.itinerary.filter((item) => item.kidFriendly).length;
  const primaryAction = getPrimaryAction(trip);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.94fr)]">
          <div className="px-6 py-6 sm:px-8 sm:py-8 lg:px-10">
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">Detailed itinerary</Badge>
              <Badge variant={trip.status === "COMPLETED" ? "success" : trip.status === "LIVE" ? "warning" : "info"}>
                {formatTripPlannerStatusLabel(trip.status)}
              </Badge>
            </div>
            <h1 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--foreground)] sm:text-4xl lg:text-5xl">
              {trip.name}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">{getOverviewCopy(trip)}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
              <span>{trip.park.name}</span>
              <span>{format(new Date(trip.visitDate), "EEEE, MMM d")}</span>
              <span>{trip.partyProfile.partySize} guests</span>
              <span>{trip.itinerary.length} planned stops</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/trips/${trip.id}`} className={buttonStyles({ variant: "secondary", size: "default" })}>
                Back to planner
              </Link>
              <Link href={primaryAction.href} className={buttonStyles({ variant: "primary", size: "default" })}>
                {primaryAction.label}
              </Link>
            </div>
          </div>
          <div className="border-t border-[var(--card-border)] p-4 xl:border-l xl:border-t-0">
            <VisualShowcase
              src={generatedVisuals.planners.studio}
              alt="Parqara itinerary visual"
              eyebrow="Route overview"
              title={primaryAction.title}
              description={primaryAction.description}
              chips={[`${averageWait}m avg wait`, `${totalWalking}m walking`, `${diningStops} dining`]}
              aspect="square"
              className="h-full"
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card className="p-6 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Itinerary timeline</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Ordered route for the day</h2>
            </div>
            <p className="text-sm text-[var(--muted)]">Arrival windows, expected waits, and route context are attached to each stop.</p>
          </div>

          <div className="mt-6 space-y-5">
            {trip.itinerary.map((item, index) => (
              <div key={item.id} className="relative pl-10">
                {index < trip.itinerary.length - 1 ? (
                  <div className="absolute left-[15px] top-12 h-[calc(100%+1.5rem)] w-px bg-[rgba(124,149,182,0.22)]" />
                ) : null}
                <div className="absolute left-0 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--card-border)] bg-white text-sm font-semibold text-[var(--foreground)]">
                  {index + 1}
                </div>
                <div className="rounded-[30px] border border-[var(--card-border)] bg-white p-5 shadow-[0_12px_28px_rgba(12,20,37,0.06)] sm:p-6">
                  <div className="grid gap-5 xl:grid-cols-[150px_minmax(0,1fr)_220px]">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Timing</p>
                      <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">{format(new Date(item.startTime), "h:mm a")}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">to {format(new Date(item.endTime), "h:mm a")}</p>
                      <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Arrive by {format(new Date(item.arrivalWindowStart), "h:mm a")}</p>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-[var(--foreground)]">{item.title}</h3>
                        <Badge variant={item.type === "DINING" ? "success" : item.type === "BREAK" ? "warning" : "neutral"}>
                          {item.type}
                        </Badge>
                        {item.kidFriendly ? <Badge variant="info">Kid-friendly</Badge> : null}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.explanation}</p>
                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                        <span>{item.predictedWaitMinutes} min wait</span>
                        <span>{item.walkingMinutes} min walk</span>
                        {item.zone ? <span>{item.zone}</span> : null}
                        {item.category ? <span>{item.category}</span> : null}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Why this stop</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.reason}</p>
                      <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[var(--teal-700)]">Confidence {item.confidence}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <Card className="p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Strategy notes</p>
            <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--muted)]">
              <InsightRow title="Queue timing" detail="Morning headliners and lower-friction routing get prioritized before mid-day waits harden." />
              <InsightRow title="Family fit" detail="Attractions that clash with kid ages or thrill tolerance are downgraded or omitted." />
              <InsightRow title="Break protection" detail="Meal and recovery windows are treated as real constraints so the plan stays sustainable." />
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Preference snapshot</p>
            <div className="mt-5 space-y-4">
              <PreferenceBlock label="Preferred ride types" values={trip.partyProfile.preferredRideTypes} emptyLabel="No ride types selected" />
              <PreferenceBlock label="Dining preferences" values={trip.partyProfile.diningPreferences} emptyLabel="No dining preferences selected" />
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Day context</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <ContextTile icon={<CalendarDays className="h-4 w-4" />} label="Visit date" value={format(new Date(trip.visitDate), "EEEE, MMM d")} />
              <ContextTile icon={<MapPinned className="h-4 w-4" />} label="Park" value={trip.park.name} />
              <ContextTile icon={<Route className="h-4 w-4" />} label="Planned stops" value={String(trip.itinerary.length)} />
              <ContextTile icon={<Sparkles className="h-4 w-4" />} label="Kid-friendly slots" value={String(kidFriendlyStops)} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ContextTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--card-border)] bg-white p-4">
      <div className="flex items-center gap-3 text-[var(--foreground)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(238,253,249,0.9)] text-[var(--teal-700)]">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InsightRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--card-border)] bg-white p-4">
      <p className="font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function PreferenceBlock({ label, values, emptyLabel }: { label: string; values: string[]; emptyLabel: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--card-border)] bg-white p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
      {values.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value} variant="neutral">
              {value.replaceAll("-", " ")}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--muted)]">{emptyLabel}</p>
      )}
    </div>
  );
}


