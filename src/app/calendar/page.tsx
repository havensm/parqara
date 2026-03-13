import { CalendarDays, CalendarSync, MapPinned, Route } from "lucide-react";

import type { CalendarTripItem } from "@/lib/calendar";
import { buildCalendarFeedUrl, buildCalendarSubscriptionUrl } from "@/lib/calendar-feed";
import { formatIsoDate } from "@/lib/date-utils";
import { getTripWorkspaceHref } from "@/lib/trip-workspace";
import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import { listDashboardTrips } from "@/server/services/trip-service";

import { AppShell } from "@/components/app/app-shell";
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";

function buildCalendarTrips(trips: Awaited<ReturnType<typeof listDashboardTrips>>): CalendarTripItem[] {
  const todayKey = formatIsoDate(new Date());

  return trips
    .filter((trip) => trip.visitDate >= todayKey)
    .sort((left, right) => left.visitDate.localeCompare(right.visitDate))
    .map((trip) => ({
      id: trip.id,
      name: trip.name,
      parkName: trip.parkName,
      status: trip.status,
      visitDate: trip.visitDate,
      latestPlanSummary: trip.latestPlanSummary,
      href: getTripWorkspaceHref(trip),
    }));
}

export default async function CalendarPage() {
  const user = await requireCompletedOnboardingUser();
  const trips = buildCalendarTrips(await listDashboardTrips(user.id));
  const statusCounts = trips.reduce(
    (counts, trip) => {
      counts[trip.status] += 1;
      return counts;
    },
    { DRAFT: 0, PLANNED: 0, LIVE: 0, COMPLETED: 0 }
  );
  const initialMonthKey = trips[0]?.visitDate.slice(0, 7) ?? formatIsoDate(new Date()).slice(0, 7);

  return (
    <AppShell
      eyebrow="Calendar"
      title="See every upcoming trip on one calendar."
      description="Track upcoming Parqara trips, pull in your personal calendar, and jump straight back into the planner from the date that matters."
      actionHref="/trips/new?fresh=1"
      actionLabel="Start a new trip"
      icon={<CalendarDays className="h-6 w-6" />}
      highlights={[
        { icon: <Route className="h-4 w-4" />, label: `${trips.length} upcoming trip${trips.length === 1 ? "" : "s"}` },
        { icon: <CalendarSync className="h-4 w-4" />, label: "Import .ics personal calendars" },
        { icon: <MapPinned className="h-4 w-4" />, label: "Open any trip back in the planner" },
      ]}
      visual={
        <div className="grid gap-3 sm:grid-cols-2">
          <CalendarMetricCard label="Draft" value={String(statusCounts.DRAFT)} tone="amber" />
          <CalendarMetricCard label="Planned" value={String(statusCounts.PLANNED)} tone="teal" />
          <CalendarMetricCard label="Live" value={String(statusCounts.LIVE)} tone="sky" />
          <CalendarMetricCard label="Synced out" value="ICS" tone="slate" />
        </div>
      }
    >
      <CalendarWorkspace
        trips={trips}
        initialMonthKey={initialMonthKey}
        feedUrl={buildCalendarFeedUrl(user.id)}
        subscriptionUrl={buildCalendarSubscriptionUrl(user.id)}
      />
    </AppShell>
  );
}

function CalendarMetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "sky" | "slate" | "teal";
}) {
  const toneClassNames = {
    amber: "bg-[linear-gradient(180deg,#fff8eb_0%,#ffffff_100%)] text-amber-700",
    sky: "bg-[linear-gradient(180deg,#f2f8ff_0%,#ffffff_100%)] text-sky-700",
    slate: "bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] text-slate-700",
    teal: "bg-[linear-gradient(180deg,#effbf8_0%,#ffffff_100%)] text-teal-700",
  } as const;

  return (
    <div className={`rounded-[24px] border border-slate-200 px-5 py-5 ${toneClassNames[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em]">{label}</p>
      <p className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
