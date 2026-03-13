import { NextResponse } from "next/server";

import type { CalendarTripItem } from "@/lib/calendar";
import { buildTripsCalendarIcs, verifyCalendarFeedToken } from "@/lib/calendar-feed";
import { formatIsoDate } from "@/lib/date-utils";
import { getTripWorkspaceHref } from "@/lib/trip-workspace";
import { listDashboardTrips } from "@/server/services/trip-service";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user");
  const token = searchParams.get("token");

  if (!userId || !token || !verifyCalendarFeedToken(userId, token)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = buildTripsCalendarIcs(buildCalendarTrips(await listDashboardTrips(userId)));

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="parqara-trips.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
