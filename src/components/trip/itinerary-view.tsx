import type { ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock3,
  Footprints,
  MapPinned,
  Route,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import { canAccessBillingFeature } from "@/lib/billing";
import type { ItineraryItemDto, SubscriptionTierValue, TripDetailDto } from "@/lib/contracts";
import { generatedVisuals } from "@/lib/generated-assets";
import { formatTripPlannerStatusLabel } from "@/lib/trip-planner-agent";

import { PlanBadge } from "@/components/billing/plan-badge";
import { PlannerSectionKicker } from "@/components/trip/planner-section-kicker";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisualShowcase } from "@/components/ui/visual-showcase";

function getOverviewCopy(trip: TripDetailDto) {
  if (trip.latestPlanSummary) {
    return trip.latestPlanSummary;
  }

  if (trip.status === "LIVE") {
    return "Live mode is active. Keep the route, signals, and next move close.";
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

function formatTimeLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return format(parsed, "h:mm a");
}

function getRoutePosture(averageWait: number, totalWalking: number) {
  if (averageWait >= 35 || totalWalking >= 80) {
    return "High-energy route";
  }

  if (averageWait >= 22 || totalWalking >= 55) {
    return "Balanced pace";
  }

  return "Easy-moving day";
}

function getItemTone(item: ItineraryItemDto) {
  switch (item.type) {
    case "DINING":
      return {
        dot: "bg-amber-400",
        surface: "border-amber-100 bg-[linear-gradient(180deg,rgba(255,250,239,0.98),rgba(255,255,255,0.98))]",
      };
    case "SHOW":
      return {
        dot: "bg-violet-400",
        surface: "border-violet-100 bg-[linear-gradient(180deg,rgba(248,244,255,0.98),rgba(255,255,255,0.98))]",
      };
    case "BREAK":
      return {
        dot: "bg-slate-400",
        surface: "border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))]",
      };
    default:
      return {
        dot: "bg-teal-400",
        surface: "border-teal-100 bg-[linear-gradient(180deg,rgba(239,251,248,0.98),rgba(255,255,255,0.98))]",
      };
  }
}

export function ItineraryView({ trip, currentTier }: { trip: TripDetailDto; currentTier: SubscriptionTierValue }) {
  const averageWait = Math.round(
    trip.itinerary.reduce((total, item) => total + item.predictedWaitMinutes, 0) / Math.max(trip.itinerary.length, 1)
  );
  const totalWalking = trip.itinerary.reduce((total, item) => total + item.walkingMinutes, 0);
  const diningStops = trip.itinerary.filter((item) => item.type === "DINING").length;
  const kidFriendlyStops = trip.itinerary.filter((item) => item.kidFriendly).length;
  const primaryAction = getPrimaryAction(trip);
  const nextItem = trip.itinerary.find((item) => item.status === "PLANNED") ?? trip.itinerary[0] ?? null;
  const breakWindow =
    trip.partyProfile.breakStart && trip.partyProfile.breakEnd
      ? `${trip.partyProfile.breakStart} to ${trip.partyProfile.breakEnd}`
      : "No break window saved";
  const requiresPlus = trip.status !== "COMPLETED";
  const liveModeLocked = requiresPlus && !canAccessBillingFeature(currentTier, "liveDashboard");
  const liveActionLabel = liveModeLocked ? "Preview live mode" : primaryAction.label;
  const routePosture = getRoutePosture(averageWait, totalWalking);

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-6 sm:px-7 sm:py-7">
        <PlannerSectionKicker emoji="🗂️" label="Trip overview" tone="teal" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-[2.5rem]">
            {trip.status === "COMPLETED" ? "Finished plan" : "Current plan"}
          </h2>
          <span className="rounded-full border border-[var(--card-border)] bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            {formatTripPlannerStatusLabel(trip.status)}
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">{getOverviewCopy(trip)}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/trips/${trip.id}/itinerary`} className={buttonStyles({ variant: "primary", size: "default" })}>
            View itinerary
          </Link>
          <Link href={primaryAction.href} className={buttonStyles({ variant: "secondary", size: "default" })}>
            {liveActionLabel}
          </Link>
          {requiresPlus ? <PlanBadge tier="PLUS" /> : null}
        </div>
      </div>

      <div className="p-6 sm:p-7">
        <Tabs defaultValue="route" className="space-y-0">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:flex-1">
              <MetricTile label="Park" value={trip.park.name} detail={trip.park.resort} icon={<MapPinned className="h-5 w-5" />} />
              <MetricTile
                label="Date"
                value={format(new Date(trip.visitDate), "EEEE, MMM d")}
                detail={`${trip.partyProfile.startTime} arrival`}
                icon={<CalendarDays className="h-5 w-5" />}
              />
              <MetricTile label="Stops" value={String(trip.itinerary.length)} detail={`${diningStops} dining, ${kidFriendlyStops} kid-friendly`} icon={<Route className="h-5 w-5" />} />
              <MetricTile label="Avg wait" value={`${averageWait}m`} detail={`Estimated walking ${totalWalking}m`} icon={<Clock3 className="h-5 w-5" />} />
            </div>

            <TabsList>
              <TabsTrigger value="route">Route</TabsTrigger>
              <TabsTrigger value="signals">Signals</TabsTrigger>
              <TabsTrigger value="profile">Saved profile</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="route" className="mt-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
              <div className="space-y-5">
                <div className="rounded-[30px] border border-[var(--card-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,251,253,0.96))] p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <PlannerSectionKicker emoji="🛤️" label="Route board" tone="sky" />
                      <h3 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">The day at a glance</h3>
                    </div>
                    <span className="glass-chip px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">{routePosture}</span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {trip.itinerary.map((item) => {
                      const tone = getItemTone(item);

                      return (
                        <div key={item.id} className={`rounded-[24px] border p-4 shadow-[0_10px_24px_rgba(12,20,37,0.06)] ${tone.surface}`}>
                          <div className="flex items-start gap-4">
                            <div className="w-20 shrink-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{formatTimeLabel(item.startTime)}</p>
                              <div className="mt-3 flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                                <span className="text-xs text-[var(--muted)]">{item.type.toLowerCase()}</span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-semibold text-[var(--foreground)]">{item.title}</p>
                                <StatusBadge status={item.status} />
                              </div>
                              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.reason}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="neutral">{item.predictedWaitMinutes}m wait</Badge>
                                <Badge variant="neutral">{item.walkingMinutes}m walk</Badge>
                                {item.zone ? <Badge variant="neutral">{item.zone}</Badge> : null}
                                {item.kidFriendly ? <Badge variant="neutral">Kid-friendly</Badge> : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <VisualShowcase
                  src={generatedVisuals.planners.studio}
                  alt="Parqara planner workspace visual"
                  eyebrow="Planner mood"
                  title={nextItem ? nextItem.title : "Plan ready"}
                  description={nextItem ? `${formatTimeLabel(nextItem.startTime)} start with ${nextItem.predictedWaitMinutes}m predicted wait.` : "The route is saved and ready for the next adjustment."}
                  chips={[routePosture, `${trip.itinerary.length} stops`]}
                  aspect="square"
                />
                <InfoCard
                  kicker="Live mode"
                  title={primaryAction.title}
                  detail={liveModeLocked ? "Plus unlocks live mode, ride completions, and instant replans." : primaryAction.description}
                  tone="sky"
                />
                <InfoCard
                  kicker="Route posture"
                  title={routePosture}
                  detail={`This plan holds ${trip.partyProfile.mustDoRideIds.length} must-do experiences and ${diningStops} food stops.`}
                  tone="amber"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="signals" className="mt-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)]">
              <div className="grid gap-4 md:grid-cols-2">
                <SignalCard icon={<Sparkles className="h-4 w-4" />} label="Plan summary" title={trip.latestPlanSummary ?? "This route is saved and ready."} />
                <SignalCard icon={<Footprints className="h-4 w-4" />} label="Walking tolerance" title={`${trip.partyProfile.walkingTolerance} walking profile`} />
                <SignalCard
                  icon={<UtensilsCrossed className="h-4 w-4" />}
                  label="Dining posture"
                  title={trip.partyProfile.diningPreferences.length ? trip.partyProfile.diningPreferences.join(", ").replaceAll("-", " ") : "No dining preferences saved"}
                />
                <SignalCard icon={<Clock3 className="h-4 w-4" />} label="Break window" title={breakWindow} />
              </div>

              <div className="rounded-[30px] border border-[var(--card-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,250,252,0.96))] p-5 sm:p-6">
                <PlannerSectionKicker emoji="⚡" label="Recommended actions" tone="amber" />
                <div className="mt-4 space-y-3">
                  <ActionRow
                    title="Pressure-test the plan with Mara"
                    detail="Ask Mara whether the route is too ambitious, too much walking, or missing a must-do."
                  />
                  <ActionRow
                    title="Open itinerary detail"
                    detail="See the routed order, timing, and explanations in the full itinerary workspace."
                  />
                  <ActionRow
                    title="Switch into live mode"
                    detail={liveModeLocked ? "Live mode is ready to unlock on Plus." : "Move into live mode when you are on the ground and need next-step guidance."}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <div className="grid gap-5 xl:grid-cols-2">
              <div className="rounded-[30px] border border-[var(--card-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,250,252,0.96))] p-5 sm:p-6">
                <PlannerSectionKicker emoji="🧠" label="Saved profile" tone="sky" />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <ProfileItem label="Thrill tolerance" value={trip.partyProfile.thrillTolerance} />
                  <ProfileItem label="Walking tolerance" value={trip.partyProfile.walkingTolerance} />
                  <ProfileItem label="Must-dos" value={String(trip.partyProfile.mustDoRideIds.length)} />
                  <ProfileItem label="Break window" value={breakWindow} />
                </div>
              </div>

              <div className="rounded-[30px] border border-[var(--card-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,250,252,0.96))] p-5 sm:p-6">
                <PlannerSectionKicker emoji="🍽️" label="Preference snapshot" tone="amber" />
                <div className="mt-4 space-y-4">
                  <PreferenceBlock label="Preferred ride types" values={trip.partyProfile.preferredRideTypes} emptyLabel="No ride styles selected" />
                  <PreferenceBlock label="Dining preferences" values={trip.partyProfile.diningPreferences} emptyLabel="No dining preferences selected" />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}

function MetricTile({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--card-border)] bg-white/88 p-4 shadow-[0_10px_24px_rgba(12,20,37,0.06)]">
      <div className="flex items-center gap-3 text-[var(--foreground)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[rgba(238,253,249,0.9)] text-[var(--teal-700)]">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function PreferenceBlock({ label, values, emptyLabel }: { label: string; values: string[]; emptyLabel: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] p-4">
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

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function InfoCard({ kicker, title, detail, tone }: { kicker: string; title: string; detail: string; tone: "amber" | "sky" | "teal" }) {
  const toneClasses = {
    amber: "bg-[linear-gradient(180deg,#fff8eb_0%,#ffffff_100%)]",
    sky: "bg-[linear-gradient(180deg,#eef7ff_0%,#ffffff_100%)]",
    teal: "bg-[linear-gradient(180deg,#effbf8_0%,#ffffff_100%)]",
  } as const;

  return (
    <div className={`rounded-[28px] border border-[var(--card-border)] p-5 ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{kicker}</p>
      <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function SignalCard({ icon, label, title }: { icon: ReactNode; label: string; title: string }) {
  return (
    <div className="rounded-[26px] border border-[var(--card-border)] bg-white/92 p-5 shadow-[0_10px_24px_rgba(12,20,37,0.06)]">
      <div className="flex items-center gap-2 text-[var(--muted)]">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--muted-strong)]">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-3 text-base font-semibold text-[var(--foreground)]">{title}</p>
    </div>
  );
}

function ActionRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--card-border)] bg-white/92 px-4 py-4 shadow-[0_10px_24px_rgba(12,20,37,0.06)]">
      <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ItineraryItemDto["status"] }) {
  const styles = {
    PLANNED: "border border-teal-100 bg-teal-50 text-teal-700",
    COMPLETED: "border border-slate-200 bg-slate-100 text-slate-600",
    SKIPPED: "border border-amber-100 bg-amber-50 text-amber-700",
    CANCELLED: "border border-rose-100 bg-rose-50 text-rose-700",
  } as const;

  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${styles[status]}`}>{status}</span>;
}

