import { Prisma } from "@prisma/client/index";

import { db } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { sendTripFinalizedPlanEmail } from "@/lib/trip-finalized-plan-email";
import { normalizeTripLiveSnapshot } from "@/lib/trip-live-snapshot";
import { createNotifications } from "@/server/services/notification-service";
import { ensureTripPeopleSeeded, getTripAccessContext } from "@/server/services/trip-people-service";
import { generateTripItinerary } from "@/server/services/trip-service";

function getTripWorkspaceHrefForStatus(tripId: string, status: "DRAFT" | "PLANNED" | "LIVE" | "COMPLETED") {
  return status === "DRAFT" ? `/dashboard?tripId=${tripId}` : `/trips/${tripId}`;
}

function hasMeaningfulSnapshot(snapshot: ReturnType<typeof normalizeTripLiveSnapshot>) {
  if (!snapshot) {
    return false;
  }

  return Boolean(
    snapshot.destination ||
      snapshot.duration ||
      snapshot.groupSummary ||
      snapshot.travelSummary ||
      snapshot.lodgingSummary ||
      snapshot.activities.length ||
      snapshot.supplies.length ||
      snapshot.latestTakeaway ||
      snapshot.mapQuery
  );
}

function parsePartySizeFromSnapshotGroup(groupSummary: string | null) {
  if (!groupSummary) {
    return null;
  }

  const match = groupSummary.match(/\b(\d+)\b/);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

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

function buildFinalizedDetail(snapshot: ReturnType<typeof normalizeTripLiveSnapshot>, tripName: string) {
  return snapshot?.latestTakeaway?.trim() || `The finalized plan for ${tripName} is ready to review.`;
}

async function hydrateDraftBasicsFromSnapshot(tripId: string) {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      status: true,
      startingLocation: true,
      latestPlanSummary: true,
      liveSnapshot: true,
      partyProfile: {
        select: {
          partySize: true,
        },
      },
      people: {
        where: {
          attendanceStatus: {
            not: "NOT_ATTENDING",
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!trip || !trip.partyProfile) {
    throw new HttpError(404, "Trip not found.");
  }

  const snapshot = normalizeTripLiveSnapshot(trip.liveSnapshot);
  if (!snapshot || !hasMeaningfulSnapshot(snapshot)) {
    throw new HttpError(400, "Ask Mara to fill in the live snapshot before finalizing the plan.");
  }

  const inferredPartySize = Math.max(
    trip.partyProfile.partySize,
    trip.people.length || 1,
    parsePartySizeFromSnapshotGroup(snapshot.groupSummary) ?? 0
  );

  const updateData: Prisma.TripUpdateInput = {};
  if (!trip.startingLocation && snapshot.mapQuery) {
    updateData.startingLocation = snapshot.mapQuery;
  }
  if (!trip.latestPlanSummary && snapshot.latestTakeaway) {
    updateData.latestPlanSummary = snapshot.latestTakeaway;
  }
  if (inferredPartySize !== trip.partyProfile.partySize) {
    updateData.partyProfile = {
      update: {
        partySize: inferredPartySize,
      },
    };
  }

  if (Object.keys(updateData).length) {
    await db.trip.update({
      where: { id: tripId },
      data: updateData,
    });
  }

  return snapshot;
}

async function sendFinalizedPlanReport(userId: string, tripId: string, appOrigin: string) {
  await ensureTripPeopleSeeded(tripId);

  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      name: true,
      status: true,
      visitDate: true,
      park: {
        select: {
          name: true,
        },
      },
      liveSnapshot: true,
      people: {
        where: {
          attendanceStatus: {
            not: "NOT_ATTENDING",
          },
        },
        select: {
          email: true,
          userId: true,
        },
      },
    },
  });

  if (!trip) {
    throw new HttpError(404, "Trip not found.");
  }

  const snapshot = normalizeTripLiveSnapshot(trip.liveSnapshot);
  const actionHref = getTripWorkspaceHrefForStatus(trip.id, trip.status);
  const actionUrl = `${appOrigin}${actionHref}`;
  const detail = buildFinalizedDetail(snapshot, trip.name);

  const userIds = [...new Set(trip.people.map((person) => person.userId).filter((value): value is string => Boolean(value && value !== userId)))];
  if (userIds.length) {
    await createNotifications({
      userIds,
      actorUserId: userId,
      tripId: trip.id,
      type: "PLANNER",
      severity: "info",
      title: `Final trip report ready for ${trip.name}`,
      detail,
      actionHref,
      dedupeKey: `trip:${trip.id}:finalized-report`,
    });
  }

  const emails = [...new Set(trip.people.map((person) => person.email).filter((value) => value.trim()))];
  await Promise.all(
    emails
      .filter((email) => email.toLowerCase() !== "")
      .map((email) =>
        sendTripFinalizedPlanEmail({
          to: email,
          tripName: trip.name,
          destination: snapshot?.destination ?? trip.park.name,
          dateLabel: formatVisitDate(trip.visitDate.toISOString()),
          latestTakeaway: snapshot?.latestTakeaway ?? detail,
          activities: snapshot?.activities ?? [],
          supplies: snapshot?.supplies ?? [],
          actionUrl,
        })
      )
  );
}

export async function finalizeTripPlan(
  userId: string,
  tripId: string,
  input: { sendReport: boolean; appOrigin: string }
) {
  const access = await getTripAccessContext(userId, tripId);
  if (!access.canEdit) {
    throw new HttpError(403, "You do not have edit access to this planner.");
  }

  await hydrateDraftBasicsFromSnapshot(tripId);
  const trip = await generateTripItinerary(userId, tripId);

  if (input.sendReport) {
    await sendFinalizedPlanReport(userId, tripId, input.appOrigin);
  }

  return {
    tripId: trip.id,
    redirectHref: `/trips/${trip.id}`,
  };
}


