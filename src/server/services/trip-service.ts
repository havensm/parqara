import type { PartyProfile, Trip } from "@prisma/client/index";
import { format } from "date-fns";

import type {
  ItineraryItemDto,
  ParkCatalogDto,
  PartyProfileDto,
  SummaryDto,
  TripCollaboratorDto,
  TripCollaboratorStateDto,
  TripDetailDto,
  UserPersonDto,
} from "@/lib/contracts";
import { addMinutesSafe, combineDateAndTime, formatDateTime, formatIsoDate } from "@/lib/date-utils";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { sendPlannerInviteEmail } from "@/lib/planner-invite-email";
import { tripSetupSchema, tripUpdateSchema } from "@/lib/validation/trip";
import type { AttractionMetadata } from "@/server/providers/contracts";
import { computeSummaryMetrics, recommendNextAction, scoreCandidate } from "@/server/engine/recommendation-engine";
import { createProviderSuite } from "@/server/providers/factory";
import { diningPreferenceOptions, preferredRideTypes } from "@/server/providers/mock/mock-data";
import { createNotifications, createOperationalNotificationsForTrip, createTripMemberNotifications } from "@/server/services/notification-service";
import { saveUserPerson } from "@/server/services/user-service";

function requirePartyProfile<T extends { partyProfile: PartyProfile | null }>(trip: T): asserts trip is T & { partyProfile: PartyProfile } {
  if (!trip.partyProfile) {
    throw new Error("Trip is missing a party profile.");
  }
}

function toPartyProfileDto(partyProfile: PartyProfile): PartyProfileDto {
  return {
    partySize: partyProfile.partySize,
    kidsAges: partyProfile.kidsAges,
    thrillTolerance: partyProfile.thrillTolerance,
    walkingTolerance: partyProfile.walkingTolerance,
    preferredRideTypes: partyProfile.preferredRideTypes,
    mustDoRideIds: partyProfile.mustDoRideIds,
    diningPreferences: partyProfile.diningPreferences,
    startTime: partyProfile.startTime,
    breakStart: partyProfile.breakStart,
    breakEnd: partyProfile.breakEnd,
  };
}

function serializeItineraryItem(item: {
  id: string;
  attractionId: string | null;
  title: string;
  type: "RIDE" | "SHOW" | "DINING" | "BREAK";
  order: number;
  startTime: Date;
  endTime: Date;
  arrivalWindowStart: Date;
  arrivalWindowEnd: Date;
  predictedWaitMinutes: number;
  walkingMinutes: number;
  score: number | null;
  reason: string;
  explanation: string;
  status: "PLANNED" | "COMPLETED" | "SKIPPED" | "CANCELLED";
  attraction?: {
    slug: string;
    zone: string;
    category: "RIDE" | "SHOW" | "DINING" | "PLAY";
    thrillLevel: number;
    kidFriendly: boolean;
  } | null;
}): ItineraryItemDto {
  return {
    id: item.id,
    attractionId: item.attractionId,
    attractionSlug: item.attraction?.slug ?? null,
    title: item.title,
    type: item.type,
    order: item.order,
    startTime: formatDateTime(item.startTime),
    endTime: formatDateTime(item.endTime),
    arrivalWindowStart: formatDateTime(item.arrivalWindowStart),
    arrivalWindowEnd: formatDateTime(item.arrivalWindowEnd),
    predictedWaitMinutes: item.predictedWaitMinutes,
    walkingMinutes: item.walkingMinutes,
    confidence: Math.round(item.score ?? 0),
    reason: item.reason,
    explanation: item.explanation,
    status: item.status,
    zone: item.attraction?.zone ?? null,
    category: item.attraction?.category ?? null,
    thrillLevel: item.attraction?.thrillLevel ?? null,
    kidFriendly: item.attraction?.kidFriendly ?? null,
  };
}

function resolveVisitDateTime(visitDate: string | Date, startTime: string) {
  return combineDateAndTime(new Date(visitDate), startTime);
}

function buildUserDisplayName(user: { email: string; firstName: string | null; lastName: string | null; name: string | null }) {
  const parts = [user.firstName, user.lastName].filter((value): value is string => Boolean(value && value.trim()));
  if (parts.length) {
    return parts.join(" ");
  }

  if (user.name?.trim()) {
    return user.name.trim();
  }

  return user.email;
}

function serializeCollaboratorMember(member: {
  id: string;
  userId: string;
  user: { email: string; firstName: string | null; lastName: string | null; name: string | null };
}): TripCollaboratorDto {
  return {
    id: member.id,
    userId: member.userId,
    email: member.user.email,
    name: buildUserDisplayName(member.user),
  };
}

function serializeOwner(user: { id: string; email: string; firstName: string | null; lastName: string | null; name: string | null }): TripCollaboratorDto {
  return {
    id: user.id,
    userId: user.id,
    email: user.email,
    name: buildUserDisplayName(user),
  };
}

function serializePendingInvite(invite: { id: string; email: string }) {
  return {
    id: invite.id,
    email: invite.email,
  };
}

function serializeUserPersonRecord(person: {
  id: string;
  contactUserId: string;
  contactUser: { email: string; firstName: string | null; lastName: string | null; name: string | null };
}): UserPersonDto {
  return {
    id: person.id,
    userId: person.contactUserId,
    email: person.contactUser.email,
    name: buildUserDisplayName(person.contactUser),
  };
}

async function sendTripInviteEmail({
  appOrigin,
  email,
  inviterName,
  parkName,
  tripName,
  tripStatus,
  tripId,
  requiresAccount,
}: {
  appOrigin: string;
  email: string;
  inviterName: string;
  parkName: string;
  tripName: string;
  tripStatus: "DRAFT" | "PLANNED" | "LIVE" | "COMPLETED";
  tripId: string;
  requiresAccount: boolean;
}) {
  const nextPath = requiresAccount
    ? `/signup?email=${encodeURIComponent(email)}`
    : getTripWorkspaceHrefForStatus(tripId, tripStatus);

  await sendPlannerInviteEmail({
    to: email,
    inviterName,
    tripName,
    parkName,
    actionUrl: `${appOrigin}${nextPath}`,
    requiresAccount,
  });
}

async function getAccessibleTrip(userId: string, tripId: string) {
  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      OR: [{ userId }, { collaborators: { some: { userId } } }],
    },
    include: {
      park: true,
      partyProfile: true,
      itineraryItems: {
        include: {
          attraction: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!trip) {
    throw new HttpError(404, "Trip not found.");
  }

  return trip;
}

async function getAccessibleTripForCollaboration(userId: string, tripId: string) {
  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      OR: [{ userId }, { collaborators: { some: { userId } } }],
    },
    include: {
      park: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
      collaborators: {
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      pendingInvites: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!trip) {
    throw new HttpError(404, "Trip not found.");
  }

  return trip;
}

async function getManageableTrip(userId: string, tripId: string, errorMessage = "Only the trip owner can manage this planner.") {
  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      userId,
    },
    include: {
      park: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
      collaborators: {
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      pendingInvites: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!trip) {
    throw new HttpError(403, errorMessage);
  }

  return trip;
}

function serializeTripCollaboratorState(
  trip: Awaited<ReturnType<typeof getAccessibleTripForCollaboration>>,
  userId: string,
  people: UserPersonDto[]
): TripCollaboratorStateDto {
  return {
    tripId: trip.id,
    canManage: trip.userId === userId,
    owner: serializeOwner(trip.user),
    collaborators: trip.collaborators.map(serializeCollaboratorMember),
    pendingInvites: trip.pendingInvites.map(serializePendingInvite),
    people,
  };
}

function getCurrentLocationMetadata(parkAttractions: AttractionMetadata[], attractionId: string | null) {
  if (!attractionId) {
    return null;
  }

  return parkAttractions.find((attraction) => attraction.id === attractionId) ?? null;
}

function getTripWorkspaceHrefForStatus(tripId: string, status: "DRAFT" | "PLANNED" | "LIVE" | "COMPLETED") {
  return status === "DRAFT" ? `/trips/new?tripId=${tripId}` : `/trips/${tripId}`;
}

function getSummaryReplanCount(summary: Trip["summary"]) {
  if (!summary || typeof summary !== "object" || !("replanCount" in summary)) {
    return 0;
  }

  return Number((summary as { replanCount?: number }).replanCount ?? 0);
}

async function persistPlan({
  trip,
  phase,
  cause,
  incrementReplanCount,
  actorUserId,
}: {
  trip: Awaited<ReturnType<typeof getAccessibleTrip>>;
  phase: "initial" | "replan";
  cause: string;
  incrementReplanCount: boolean;
  actorUserId: string;
}) {
  requirePartyProfile(trip);
  const providers = createProviderSuite();
  const parkMetadata = await providers.metadata.getParkById(trip.parkId);
  if (!parkMetadata) {
    throw new Error("Park metadata not found.");
  }

  const completedItems = trip.itineraryItems.filter((item) => item.status === "COMPLETED");
  const completedAttractionIds = new Set(
    completedItems.map((item) => item.attractionId).filter((value): value is string => Boolean(value))
  );
  const completedBreak = completedItems.some((item) => item.type === "BREAK");
  let timeCursor = trip.simulatedTime ?? combineDateAndTime(trip.visitDate, trip.partyProfile.startTime);
  let currentLocation = getCurrentLocationMetadata(parkMetadata.attractions, trip.currentLocationAttractionId);
  let mealScheduled = completedItems.some((item) => item.type === "DINING");
  let snackScheduled = completedItems.some(
    (item) => item.type === "DINING" && item.attraction?.slug === "twilight-treats"
  );
  let breakTaken = completedBreak;
  const draftItems: Array<{
    attractionId: string | null;
    title: string;
    type: "RIDE" | "SHOW" | "DINING" | "BREAK";
    startTime: Date;
    endTime: Date;
    arrivalWindowStart: Date;
    arrivalWindowEnd: Date;
    predictedWaitMinutes: number;
    walkingMinutes: number;
    score: number;
    reason: string;
    explanation: string;
  }> = [];

  while (draftItems.length < 8) {
    const currentMinutes = timeCursor.getHours() * 60 + timeCursor.getMinutes();
    const [closeHours, closeMinutes] = parkMetadata.park.closesAt.split(":").map(Number);
    if (currentMinutes >= closeHours * 60 + closeMinutes - 20) {
      break;
    }

    if (
      !breakTaken &&
      trip.partyProfile.breakStart &&
      trip.partyProfile.breakEnd &&
      currentMinutes >= Number(trip.partyProfile.breakStart.slice(0, 2)) * 60 + Number(trip.partyProfile.breakStart.slice(3)) - 10 &&
      currentMinutes <= Number(trip.partyProfile.breakEnd.slice(0, 2)) * 60 + Number(trip.partyProfile.breakEnd.slice(3))
    ) {
      const startTime = new Date(timeCursor);
      const endTime = addMinutesSafe(startTime, 30);
      draftItems.push({
        attractionId: null,
        title: "Recharge Break",
        type: "BREAK",
        startTime,
        endTime,
        arrivalWindowStart: startTime,
        arrivalWindowEnd: addMinutesSafe(startTime, 5),
        predictedWaitMinutes: 0,
        walkingMinutes: 0,
        score: 70,
        reason: "The saved break window is here, so a reset now keeps the rest of the day stable.",
        explanation: "Parqara is honoring your requested recharge window before the next queue spike starts.",
      });
      timeCursor = endTime;
      breakTaken = true;
      continue;
    }

    const waitSnapshot = await providers.waitTimes.getLiveWaits({
      parkId: trip.parkId,
      at: timeCursor,
    });

    const mode =
      !mealScheduled && currentMinutes >= 11 * 60 + 15 && currentMinutes <= 13 * 60 + 30
        ? "meal"
        : !snackScheduled &&
            currentMinutes >= 17 * 60 &&
            currentMinutes <= 19 * 60 + 15 &&
            trip.partyProfile.diningPreferences.some((preference) => preference === "dessert" || preference === "snacks")
          ? "snack"
          : "standard";
    const remainingMustDoCount = trip.partyProfile.mustDoRideIds.filter(
      (rideId) => !completedAttractionIds.has(rideId)
    ).length;

    const scored = await Promise.all(
      parkMetadata.attractions
        .filter((attraction) => !completedAttractionIds.has(attraction.id))
        .map((attraction) =>
          scoreCandidate({
            attraction,
            partyProfile: toPartyProfileDto(trip.partyProfile),
            currentTime: timeCursor,
            currentLocation,
            parkCloseTime: parkMetadata.park.closesAt,
            waitSnapshot,
            routing: providers.routing,
            mode,
            remainingMustDoCount,
          })
        )
    );

    const next = scored.filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null).sort((a, b) => b.score - a.score)[0];
    if (!next) {
      break;
    }

    const arrivalWindowStart = addMinutesSafe(timeCursor, next.walkingMinutes);
    const arrivalWindowEnd = addMinutesSafe(arrivalWindowStart, 10);
    const startTime = addMinutesSafe(arrivalWindowStart, next.waitMinutes);
    const endTime = addMinutesSafe(startTime, next.attraction.durationMinutes);
    const explanation = await providers.ai.explainItineraryStep({
      parkName: parkMetadata.park.name,
      attractionName: next.attraction.name,
      phase,
      reason: next.reason,
      topFactors: next.topFactors,
    });

    draftItems.push({
      attractionId: next.attraction.id,
      title: next.attraction.name,
      type: next.attraction.category === "PLAY" ? "RIDE" : next.attraction.category,
      startTime,
      endTime,
      arrivalWindowStart,
      arrivalWindowEnd,
      predictedWaitMinutes: next.waitMinutes,
      walkingMinutes: next.walkingMinutes,
      score: next.confidence,
      reason: next.reason,
      explanation,
    });

    completedAttractionIds.add(next.attraction.id);
    if (mode === "meal") {
      mealScheduled = true;
    }
    if (mode === "snack") {
      snackScheduled = true;
    }

    currentLocation = next.attraction;
    timeCursor = endTime;
  }

  if (draftItems.length === 0) {
    throw new Error("No itinerary items could be generated for the trip.");
  }

  const currentSnapshot = await providers.waitTimes.getLiveWaits({
    parkId: trip.parkId,
    at: trip.simulatedTime ?? combineDateAndTime(trip.visitDate, trip.partyProfile.startTime),
  });
  const currentWeather = await providers.weather.getWeather({
    parkId: trip.parkId,
    at: trip.simulatedTime ?? combineDateAndTime(trip.visitDate, trip.partyProfile.startTime),
  });
  const replanCount = getSummaryReplanCount(trip.summary) + (incrementReplanCount ? 1 : 0);
  const latestPlanSummary = await providers.ai.explainReplan({
    parkName: parkMetadata.park.name,
    cause,
    changes: draftItems.slice(0, 3).map((item) => item.title),
  });

  await db.itineraryItem.deleteMany({
    where: {
      tripId: trip.id,
      status: "PLANNED",
    },
  });

  const orderOffset = completedItems.length;
  for (const [index, item] of draftItems.entries()) {
    await db.itineraryItem.create({
      data: {
        tripId: trip.id,
        attractionId: item.attractionId,
        title: item.title,
        type: item.type,
        order: orderOffset + index + 1,
        startTime: item.startTime,
        endTime: item.endTime,
        arrivalWindowStart: item.arrivalWindowStart,
        arrivalWindowEnd: item.arrivalWindowEnd,
        predictedWaitMinutes: item.predictedWaitMinutes,
        walkingMinutes: item.walkingMinutes,
        score: item.score,
        reason: item.reason,
        explanation: item.explanation,
      },
    });
  }

  await db.parkStateSnapshot.create({
    data: {
      tripId: trip.id,
      parkId: trip.parkId,
      effectiveTime: trip.simulatedTime ?? combineDateAndTime(trip.visitDate, trip.partyProfile.startTime),
      weather: currentWeather,
      alerts: currentSnapshot.alerts,
      waitTimes: Object.fromEntries(currentSnapshot.waits.map((wait) => [wait.attractionSlug, wait.waitMinutes])),
      scenarioKey: currentSnapshot.alerts[0]?.title ?? null,
    },
  });

  const nextStatus = completedItems.length > 0 ? "LIVE" : "PLANNED";
  const actionHref = nextStatus === "LIVE" ? `/trips/${trip.id}/live` : getTripWorkspaceHrefForStatus(trip.id, nextStatus);

  await db.trip.update({
    where: { id: trip.id },
    data: {
      status: nextStatus,
      currentStep: 0,
      simulatedTime: trip.simulatedTime ?? combineDateAndTime(trip.visitDate, trip.partyProfile.startTime),
      latestPlanSummary,
      summary: {
        replanCount,
      },
    },
  });

  await createTripMemberNotifications({
    tripId: trip.id,
    actorUserId,
    excludeUserIds: [actorUserId],
    type: "PLANNER",
    severity: "info",
    title: phase === "initial" ? "A new itinerary is ready" : "The planner was replanned",
    detail: latestPlanSummary,
    actionHref,
  });

  await createOperationalNotificationsForTrip({
    tripId: trip.id,
    actorUserId,
    parkName: parkMetadata.park.name,
    alerts: currentSnapshot.alerts,
    weather: currentWeather,
    actionHref,
  });

  return getTripDetail(actorUserId, trip.id);
}

export async function getParkCatalog(slug: string): Promise<ParkCatalogDto> {
  const providers = createProviderSuite();
  const park = await providers.metadata.getParkBySlug(slug);
  if (!park) {
    throw new Error("Park not found.");
  }

  const attractionOptions = park.attractions.map((attraction) => ({
    id: attraction.id,
    slug: attraction.slug,
    name: attraction.name,
    category: attraction.category,
    zone: attraction.zone,
    thrillLevel: attraction.thrillLevel,
    kidFriendly: attraction.kidFriendly,
    familyFriendly: attraction.familyFriendly,
    tags: attraction.tags,
  }));

  return {
    park: park.park,
    attractions: attractionOptions,
    mustDoOptions: attractionOptions.filter((attraction) => attraction.category === "RIDE"),
    rideTypeOptions: preferredRideTypes,
    diningPreferenceOptions,
  };
}

export async function getDefaultParkSummary() {
  return db.park.findFirst({
    select: {
      name: true,
      slug: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}
export async function createDefaultDraftTrip(userId: string, parkSlug: string, defaultVisitDate: string) {
  const catalog = await getParkCatalog(parkSlug);
  const trip = await createTrip(userId, {
    parkSlug,
    visitDate: defaultVisitDate,
    partySize: 1,
    kidsAges: [],
    thrillTolerance: "MEDIUM",
    mustDoRideIds: [],
    preferredRideTypes: [],
    diningPreferences: [],
    walkingTolerance: "MEDIUM",
    startTime: catalog.park.opensAt,
    breakStart: null,
    breakEnd: null,
  });

  return getTripDetail(userId, trip.tripId);
}

export async function findOrCreateDraftTrip(userId: string, parkSlug: string, defaultVisitDate: string) {
  const existingDraft = await db.trip.findFirst({
    where: {
      userId,
      status: "DRAFT",
      park: {
        slug: parkSlug,
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
    },
  });

  if (existingDraft) {
    return getTripDetail(userId, existingDraft.id);
  }

  return createDefaultDraftTrip(userId, parkSlug, defaultVisitDate);
}

export async function listDashboardTrips(userId: string) {
  const trips = await db.trip.findMany({
    where: {
      OR: [{ userId }, { collaborators: { some: { userId } } }],
    },
    include: {
      park: true,
      itineraryItems: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: [{ visitDate: "desc" }, { createdAt: "desc" }],
  });

  return trips.map((trip) => ({
    id: trip.id,
    name: trip.name,
    status: trip.status,
    visitDate: formatIsoDate(trip.visitDate),
    parkName: trip.park.name,
    itineraryCount: trip.itineraryItems.length,
    currentItemTitle: trip.itineraryItems.find((item) => item.status === "PLANNED")?.title ?? null,
    latestPlanSummary:
      trip.latestPlanSummary ??
      (trip.status === "DRAFT"
        ? "Your answers are saved automatically, so you can leave the flow and resume the plan whenever you want."
        : null),
    currentStep: trip.currentStep,
    metrics: trip.summary && typeof trip.summary === "object" ? (trip.summary as Record<string, unknown>) : null,
  }));
}

export async function createTrip(userId: string, input: import("zod").infer<typeof tripSetupSchema>) {
  const providers = createProviderSuite();
  const park = await providers.metadata.getParkBySlug(input.parkSlug);
  if (!park) {
    throw new Error("Park not found.");
  }

  const visitDateTime = resolveVisitDateTime(input.visitDate, input.startTime);
  const trip = await db.trip.create({
    data: {
      userId,
      parkId: park.park.id,
      name: input.name?.trim() || `${park.park.name} ${format(new Date(input.visitDate), "MMM d")}`,
      visitDate: visitDateTime,
      status: "DRAFT",
      simulatedTime: visitDateTime,
      summary: {
        replanCount: 0,
      },
      partyProfile: {
        create: {
          partySize: input.partySize,
          kidsAges: input.kidsAges,
          thrillTolerance: input.thrillTolerance,
          walkingTolerance: input.walkingTolerance,
          preferredRideTypes: input.preferredRideTypes,
          mustDoRideIds: input.mustDoRideIds,
          diningPreferences: input.diningPreferences,
          startTime: input.startTime,
          breakStart: input.breakStart,
          breakEnd: input.breakEnd,
        },
      },
    },
  });

  return { tripId: trip.id };
}

export async function updateTrip(userId: string, tripId: string, input: import("zod").infer<typeof tripUpdateSchema>) {
  const trip = await getAccessibleTrip(userId, tripId);
  requirePartyProfile(trip);

  const nextName = input.name?.trim() || trip.name;
  const nextVisitDateTime = resolveVisitDateTime(input.visitDate ?? trip.visitDate, input.startTime ?? trip.partyProfile.startTime);
  const nextPreferredRideTypes = input.preferredRideTypes ?? trip.partyProfile.preferredRideTypes;
  const nextDiningPreferences = input.diningPreferences ?? trip.partyProfile.diningPreferences;

  const updated = await db.trip.update({
    where: { id: trip.id },
    data: {
      name: nextName,
      visitDate: nextVisitDateTime,
      currentStep: input.currentStep ?? trip.currentStep,
      simulatedTime:
        input.visitDate || input.startTime || trip.status === "DRAFT"
          ? nextVisitDateTime
          : trip.simulatedTime,
      partyProfile: {
        update: {
          partySize: input.partySize ?? trip.partyProfile.partySize,
          kidsAges: input.kidsAges ?? trip.partyProfile.kidsAges,
          thrillTolerance: input.thrillTolerance ?? trip.partyProfile.thrillTolerance,
          walkingTolerance: input.walkingTolerance ?? trip.partyProfile.walkingTolerance,
          preferredRideTypes: nextPreferredRideTypes,
          mustDoRideIds: input.mustDoRideIds ?? trip.partyProfile.mustDoRideIds,
          diningPreferences: nextDiningPreferences,
          startTime: input.startTime ?? trip.partyProfile.startTime,
          breakStart: input.breakStart === undefined ? trip.partyProfile.breakStart : input.breakStart,
          breakEnd: input.breakEnd === undefined ? trip.partyProfile.breakEnd : input.breakEnd,
        },
      },
    },
  });

  if (nextName.trim() !== trip.name.trim()) {
    await createTripMemberNotifications({
      tripId: trip.id,
      actorUserId: userId,
      excludeUserIds: [userId],
      type: "PLANNER",
      severity: "info",
      title: "Planner renamed",
      detail: `The shared planner is now named ${nextName}.`,
      actionHref: getTripWorkspaceHrefForStatus(trip.id, trip.status),
    });
  }

  return { tripId: updated.id };
}

export async function deleteTrip(userId: string, tripId: string) {
  const trip = await getManageableTrip(userId, tripId, "Only the trip owner can delete this planner.");

  await createTripMemberNotifications({
    tripId: trip.id,
    actorUserId: userId,
    excludeUserIds: [userId],
    type: "PLANNER",
    severity: "warning",
    title: "Planner deleted",
    detail: `${trip.name} was deleted and is no longer available in the shared workspace.`,
    actionHref: "/dashboard",
  });

  await db.trip.delete({
    where: { id: trip.id },
  });

  return { tripId: trip.id };
}

export async function generateTripItinerary(userId: string, tripId: string) {
  const trip = await getAccessibleTrip(userId, tripId);
  return persistPlan({
    trip,
    phase: "initial",
    cause: "Building the first version of the day with current wait curves and your saved constraints",
    incrementReplanCount: false,
    actorUserId: userId,
  });
}

export async function replanTrip(userId: string, tripId: string) {
  const trip = await getAccessibleTrip(userId, tripId);
  return persistPlan({
    trip,
    phase: "replan",
    cause: "Live conditions changed, so the remaining plan is being rebalanced around the latest waits and alerts",
    incrementReplanCount: true,
    actorUserId: userId,
  });
}

export async function getTripDetail(userId: string, tripId: string): Promise<TripDetailDto> {
  const trip = await getAccessibleTrip(userId, tripId);
  requirePartyProfile(trip);

  return {
    id: trip.id,
    name: trip.name,
    isOwner: trip.userId === userId,
    status: trip.status,
    visitDate: formatIsoDate(trip.visitDate),
    simulatedTime: trip.simulatedTime ? formatDateTime(trip.simulatedTime) : null,
    currentStep: trip.currentStep,
    latestPlanSummary: trip.latestPlanSummary,
    park: {
      id: trip.park.id,
      slug: trip.park.slug,
      name: trip.park.name,
      resort: trip.park.resort,
      description: trip.park.description,
      opensAt: trip.park.opensAt,
      closesAt: trip.park.closesAt,
    },
    partyProfile: toPartyProfileDto(trip.partyProfile),
    itinerary: trip.itineraryItems.map(serializeItineraryItem),
  };
}

export async function getTripCollaboratorState(userId: string, tripId: string): Promise<TripCollaboratorStateDto> {
  const trip = await getAccessibleTripForCollaboration(userId, tripId);
  const people = trip.userId === userId ? await getSavedPeople(userId) : [];
  return serializeTripCollaboratorState(trip, userId, people);
}

async function getSavedPeople(userId: string): Promise<UserPersonDto[]> {
  const people = await db.userContact.findMany({
    where: {
      ownerUserId: userId,
    },
    include: {
      contactUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return people.map(serializeUserPersonRecord);
}

export async function claimPendingTripInvitesForUser(userId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return;
  }

  const invites = await db.tripCollaboratorInvite.findMany({
    where: {
      email: normalizedEmail,
    },
    include: {
      trip: {
        select: {
          id: true,
          name: true,
          status: true,
          userId: true,
          collaborators: {
            where: {
              userId,
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  for (const invite of invites) {
    if (invite.trip.userId === userId || invite.trip.collaborators.length > 0) {
      await db.tripCollaboratorInvite.delete({
        where: {
          id: invite.id,
        },
      });
      continue;
    }

    await db.tripCollaborator.create({
      data: {
        tripId: invite.tripId,
        userId,
      },
    });

    await saveUserPerson(invite.invitedByUserId, userId);

    await db.tripCollaboratorInvite.delete({
      where: {
        id: invite.id,
      },
    });

    const actionHref = getTripWorkspaceHrefForStatus(invite.trip.id, invite.trip.status);

    await createNotifications({
      userIds: [userId],
      actorUserId: invite.invitedByUserId,
      tripId: invite.trip.id,
      type: "COLLABORATION",
      severity: "info",
      title: `Your invite to ${invite.trip.name} is ready`,
      detail: "Your new account now has access to the shared planner.",
      actionHref,
    });

    await createTripMemberNotifications({
      tripId: invite.trip.id,
      actorUserId: invite.invitedByUserId,
      excludeUserIds: [invite.invitedByUserId, userId],
      type: "COLLABORATION",
      severity: "info",
      title: "Invited collaborator joined",
      detail: `${normalizedEmail} created an account and can now open this planner.`,
      actionHref,
    });
  }
}

export async function addTripCollaborator(
  userId: string,
  tripId: string,
  email: string,
  appOrigin: string
): Promise<TripCollaboratorStateDto> {
  const trip = await getManageableTrip(userId, tripId);
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new HttpError(400, "Email is required.");
  }

  if (normalizedEmail === trip.user.email.toLowerCase()) {
    throw new HttpError(400, "The trip owner already has access.");
  }

  const existingInvite = trip.pendingInvites.find((item) => item.email === normalizedEmail);
  const collaborator = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
    },
  });

  if (collaborator) {
    const existingCollaborator = trip.collaborators.find((item) => item.userId === collaborator.id);
    if (existingCollaborator) {
      throw new HttpError(400, "That user already has access to this trip.");
    }

    const createdCollaborator = await db.tripCollaborator.create({
      data: {
        tripId: trip.id,
        userId: collaborator.id,
      },
    });

    const actionHref = getTripWorkspaceHrefForStatus(trip.id, trip.status);

    try {
      await sendTripInviteEmail({
        appOrigin,
        email: collaborator.email,
        inviterName: buildUserDisplayName(trip.user),
        parkName: trip.park.name,
        tripName: trip.name,
        tripStatus: trip.status,
        tripId: trip.id,
        requiresAccount: false,
      });
    } catch (error) {
      await db.tripCollaborator
        .delete({
          where: {
            id: createdCollaborator.id,
          },
        })
        .catch(() => undefined);

      throw error;
    }

    if (existingInvite) {
      await db.tripCollaboratorInvite.delete({
        where: {
          id: existingInvite.id,
        },
      });
    }

    await saveUserPerson(userId, collaborator.id);

    await createNotifications({
      userIds: [collaborator.id],
      actorUserId: userId,
      tripId: trip.id,
      type: "COLLABORATION",
      severity: "info",
      title: `You were added to ${trip.name}`,
      detail: "Open the shared planner to review the trip and keep planning with the group.",
      actionHref,
    });

    await createTripMemberNotifications({
      tripId: trip.id,
      actorUserId: userId,
      excludeUserIds: [userId, collaborator.id],
      type: "COLLABORATION",
      severity: "info",
      title: "Collaborator added",
      detail: `${buildUserDisplayName(collaborator)} can now view and edit this planner.`,
      actionHref,
    });
  } else {
    if (existingInvite) {
      throw new HttpError(400, "An invite has already been sent to that email.");
    }

    const invite = await db.tripCollaboratorInvite.create({
      data: {
        tripId: trip.id,
        invitedByUserId: userId,
        email: normalizedEmail,
      },
    });

    try {
      await sendTripInviteEmail({
        appOrigin,
        email: normalizedEmail,
        inviterName: buildUserDisplayName(trip.user),
        parkName: trip.park.name,
        tripName: trip.name,
        tripStatus: trip.status,
        tripId: trip.id,
        requiresAccount: true,
      });
    } catch (error) {
      await db.tripCollaboratorInvite
        .delete({
          where: {
            id: invite.id,
          },
        })
        .catch(() => undefined);

      throw error;
    }

    await createTripMemberNotifications({
      tripId: trip.id,
      actorUserId: userId,
      excludeUserIds: [userId],
      type: "COLLABORATION",
      severity: "info",
      title: "Invite sent",
      detail: `${normalizedEmail} was invited to this planner and will gain access after creating an account.`,
      actionHref: getTripWorkspaceHrefForStatus(trip.id, trip.status),
    });
  }

  const updatedTrip = await getManageableTrip(userId, tripId);
  const people = await getSavedPeople(userId);
  return serializeTripCollaboratorState(updatedTrip, userId, people);
}

export async function removeTripCollaboratorInvite(userId: string, tripId: string, inviteId: string): Promise<TripCollaboratorStateDto> {
  const trip = await getManageableTrip(userId, tripId);
  const invite = trip.pendingInvites.find((item) => item.id === inviteId);

  if (!invite) {
    throw new HttpError(404, "Invite not found.");
  }

  await db.tripCollaboratorInvite.delete({
    where: {
      id: invite.id,
    },
  });

  const updatedTrip = await getManageableTrip(userId, tripId);
  const people = await getSavedPeople(userId);
  return serializeTripCollaboratorState(updatedTrip, userId, people);
}

export async function removeTripCollaborator(userId: string, tripId: string, collaboratorId: string): Promise<TripCollaboratorStateDto> {
  const trip = await getManageableTrip(userId, tripId);
  const collaborator = trip.collaborators.find((item) => item.id === collaboratorId);

  if (!collaborator) {
    throw new HttpError(404, "Collaborator not found.");
  }

  await db.tripCollaborator.delete({
    where: { id: collaborator.id },
  });

  await createNotifications({
    userIds: [collaborator.userId],
    actorUserId: userId,
    tripId: trip.id,
    type: "COLLABORATION",
    severity: "warning",
    title: `You were removed from ${trip.name}`,
    detail: "That shared planner is no longer available from your workspace.",
    actionHref: "/dashboard",
  });

  await createTripMemberNotifications({
    tripId: trip.id,
    actorUserId: userId,
    excludeUserIds: [userId, collaborator.userId],
    type: "COLLABORATION",
    severity: "warning",
    title: "Collaborator removed",
    detail: `${collaborator.user.name ?? collaborator.user.email} no longer has access to this planner.`,
    actionHref: getTripWorkspaceHrefForStatus(trip.id, trip.status),
  });

  const updatedTrip = await getManageableTrip(userId, tripId);
  const people = await getSavedPeople(userId);
  return serializeTripCollaboratorState(updatedTrip, userId, people);
}

export async function getLiveDashboard(userId: string, tripId: string) {
  const trip = await getAccessibleTrip(userId, tripId);
  requirePartyProfile(trip);
  const providers = createProviderSuite();
  const parkMetadata = await providers.metadata.getParkById(trip.parkId);
  if (!parkMetadata) {
    throw new Error("Park metadata not found.");
  }

  const currentTime = trip.simulatedTime ?? combineDateAndTime(trip.visitDate, trip.partyProfile.startTime);
  const waitSnapshot = await providers.waitTimes.getLiveWaits({
    parkId: trip.parkId,
    at: currentTime,
  });
  const weather = await providers.weather.getWeather({
    parkId: trip.parkId,
    at: currentTime,
  });
  const completedAttractionIds = new Set(
    trip.itineraryItems
      .filter((item) => item.status === "COMPLETED")
      .map((item) => item.attractionId)
      .filter((value): value is string => Boolean(value))
  );
  const currentLocation = getCurrentLocationMetadata(parkMetadata.attractions, trip.currentLocationAttractionId);
  const recommendation = await recommendNextAction({
    attractions: parkMetadata.attractions,
    partyProfile: toPartyProfileDto(trip.partyProfile),
    currentTime,
    currentLocation,
    parkCloseTime: parkMetadata.park.closesAt,
    waitSnapshot,
    routing: providers.routing,
    completedAttractionIds,
    completedBreak: trip.itineraryItems.some((item) => item.type === "BREAK" && item.status === "COMPLETED"),
  });

  const currentAction = trip.itineraryItems.find((item) => item.status === "PLANNED") ?? null;
  const extraAlerts = [...waitSnapshot.alerts];
  if (currentAction?.attractionId) {
    const currentWait = waitSnapshot.waits.find((wait) => wait.attractionId === currentAction.attractionId);
    if (currentWait?.status && currentWait.status !== "OPEN") {
      extraAlerts.unshift({
        severity: "critical",
        title: `${currentAction.title} is currently unavailable`,
        detail: "Replan to swap this stop for the next best open option.",
      });
    }
  }
  if (
    recommendation &&
    currentAction?.attractionId &&
    recommendation.attraction.id !== currentAction.attractionId &&
    recommendation.waitMinutes + 12 < currentAction.predictedWaitMinutes
  ) {
    extraAlerts.unshift({
      severity: "info",
      title: `A better move is available now: ${recommendation.attraction.name}`,
      detail: "Live waits shifted enough that the planner sees a lower-friction next stop.",
    });
  }

  const recommendationExplanation = recommendation
    ? await providers.ai.explainItineraryStep({
        parkName: parkMetadata.park.name,
        attractionName: recommendation.attraction.name,
        phase: "live",
        reason: recommendation.reason,
        topFactors: recommendation.topFactors,
      })
    : null;

  await createOperationalNotificationsForTrip({
    tripId: trip.id,
    actorUserId: userId,
    parkName: parkMetadata.park.name,
    alerts: extraAlerts,
    weather,
    actionHref: `/trips/${trip.id}/live`,
  });

  return {
    tripId: trip.id,
    tripName: trip.name,
    status: trip.status,
    simulatedTime: formatDateTime(currentTime),
    currentAction: currentAction ? serializeItineraryItem(currentAction) : null,
    recommendation: recommendation
      ? {
          attractionId: recommendation.attraction.id,
          attractionSlug: recommendation.attraction.slug,
          title: recommendation.attraction.name,
          reason: recommendation.reason,
          explanation: recommendationExplanation ?? recommendation.reason,
          waitMinutes: recommendation.waitMinutes,
          walkingMinutes: recommendation.walkingMinutes,
          confidence: recommendation.confidence,
          zone: recommendation.attraction.zone,
        }
      : null,
    upcomingItems: trip.itineraryItems
      .filter((item) => item.status === "PLANNED")
      .slice(0, 4)
      .map(serializeItineraryItem),
    alerts: extraAlerts,
    weather,
    latestPlanSummary: trip.latestPlanSummary,
  };
}

export async function completeCurrentItem(userId: string, tripId: string) {
  const trip = await getAccessibleTrip(userId, tripId);
  const nextItem = trip.itineraryItems.find((item) => item.status === "PLANNED");
  if (!nextItem) {
    return getTripSummary(userId, tripId);
  }

  await db.itineraryItem.update({
    where: { id: nextItem.id },
    data: {
      status: "COMPLETED",
      completedAt: nextItem.endTime,
    },
  });

  const remainingPlannedItems = trip.itineraryItems.filter((item) => item.status === "PLANNED" && item.id !== nextItem.id);
  const replanCount = getSummaryReplanCount(trip.summary);

  if (remainingPlannedItems.length === 0) {
    const completedItems = [...trip.itineraryItems.filter((item) => item.status === "COMPLETED"), { ...nextItem, status: "COMPLETED" as const }];
    const metrics = computeSummaryMetrics(
      completedItems.map((item) => ({
        predictedWaitMinutes: item.predictedWaitMinutes,
        walkingMinutes: item.walkingMinutes,
        type: item.type,
      })),
      replanCount
    );

    await db.trip.update({
      where: { id: trip.id },
      data: {
        status: "COMPLETED",
        currentStep: nextItem.order,
        simulatedTime: nextItem.endTime,
        currentLocationAttractionId: nextItem.attractionId,
        summary: {
          ...metrics,
          replanCount,
        },
      },
    });

    await createTripMemberNotifications({
      tripId: trip.id,
      actorUserId: userId,
      excludeUserIds: [userId],
      type: "PLANNER",
      severity: "info",
      title: "Trip completed",
      detail: `${nextItem.title} was marked complete and the shared trip is now finished.`,
      actionHref: `/trips/${trip.id}/summary`,
    });

    return getTripSummary(userId, tripId);
  }

  await db.trip.update({
    where: { id: trip.id },
    data: {
      status: "LIVE",
      currentStep: nextItem.order,
      simulatedTime: nextItem.endTime,
      currentLocationAttractionId: nextItem.attractionId,
    },
  });

  await createTripMemberNotifications({
    tripId: trip.id,
    actorUserId: userId,
    excludeUserIds: [userId],
    type: "PLANNER",
    severity: "info",
    title: "Planner progress updated",
    detail: `${nextItem.title} was marked complete in the shared planner.`,
    actionHref: `/trips/${trip.id}/live`,
  });

  return getLiveDashboard(userId, tripId);
}

export async function getTripSummary(userId: string, tripId: string): Promise<SummaryDto> {
  const trip = await getAccessibleTrip(userId, tripId);
  const completedItems = trip.itineraryItems.filter((item) => item.status === "COMPLETED");
  const metrics =
    trip.summary && typeof trip.summary === "object" && "ridesCompleted" in trip.summary
      ? {
          ridesCompleted: Number((trip.summary as Record<string, unknown>).ridesCompleted ?? 0),
          timeSavedMinutes: Number((trip.summary as Record<string, unknown>).timeSavedMinutes ?? 0),
          averagePredictedWait: Number((trip.summary as Record<string, unknown>).averagePredictedWait ?? 0),
          efficiencyScore: Number((trip.summary as Record<string, unknown>).efficiencyScore ?? 0),
          replanCount: Number((trip.summary as Record<string, unknown>).replanCount ?? 0),
        }
      : computeSummaryMetrics(
          completedItems.map((item) => ({
            predictedWaitMinutes: item.predictedWaitMinutes,
            walkingMinutes: item.walkingMinutes,
            type: item.type,
          })),
          getSummaryReplanCount(trip.summary)
        );

  return {
    tripId: trip.id,
    tripName: trip.name,
    visitDate: formatIsoDate(trip.visitDate),
    metrics,
    completedItems: completedItems.map(serializeItineraryItem),
    highlights: [
      `${metrics.ridesCompleted} headliners and shows completed`,
      `${metrics.timeSavedMinutes} minutes saved against a naive midday-first plan`,
      `${metrics.averagePredictedWait} minute average predicted wait`,
    ],
    latestPlanSummary: trip.latestPlanSummary,
  };
}

