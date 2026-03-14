import { getEffectiveSubscriptionTier, getPlanByTier, getPlannerLimitForTier } from "@/lib/billing";
import type { DashboardTripDto, PlannerLimitStateDto } from "@/lib/contracts";
import { formatIsoDate } from "@/lib/date-utils";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http-error";

export async function getOwnedPlannerUsage(userId: string) {
  const [user, activePlannerCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    }),
    db.trip.count({
      where: {
        userId,
        plannerStatus: "ACTIVE",
      },
    }),
  ]);

  if (!user) {
    throw new Error("User not found.");
  }

  const currentTier = getEffectiveSubscriptionTier(user.subscriptionTier, user.subscriptionStatus);
  const plannerLimit = getPlannerLimitForTier(currentTier);

  return {
    currentTier,
    activePlannerCount,
    plannerLimit,
    canCreate: activePlannerCount < plannerLimit,
  };
}

function buildPlannerTripSummary(trip: {
  id: string;
  name: string;
  status: DashboardTripDto["status"];
  visitDate: Date;
  park: { name: string };
}) {
  return {
    id: trip.id,
    name: trip.name,
    status: trip.status,
    visitDate: formatIsoDate(trip.visitDate),
    parkName: trip.park.name,
  };
}

export async function getPlannerLimitState(userId: string): Promise<PlannerLimitStateDto> {
  const usage = await getOwnedPlannerUsage(userId);
  const [activeTrips, archivedTrips] = await Promise.all([
    db.trip.findMany({
      where: {
        userId,
        plannerStatus: "ACTIVE",
      },
      include: {
        park: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    }),
    db.trip.findMany({
      where: {
        userId,
        plannerStatus: "ARCHIVED",
      },
      include: {
        park: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
  ]);

  return {
    currentTier: usage.currentTier,
    activePlannerCount: usage.activePlannerCount,
    plannerLimit: usage.plannerLimit,
    canCreate: usage.canCreate,
    activeTrips: activeTrips.map(buildPlannerTripSummary),
    archivedTrips: archivedTrips.map(buildPlannerTripSummary),
  };
}

export function buildPlannerLimitMessage(currentTier: PlannerLimitStateDto["currentTier"], plannerLimit: number) {
  const planName = getPlanByTier(currentTier).name;
  const plannerLabel = plannerLimit === 1 ? "active planner" : "active planners";

  return `Your ${planName} plan includes ${plannerLimit} ${plannerLabel}. Archive an existing planner or upgrade to keep creating new ones.`;
}

export async function ensurePlannerCanBeCreated(userId: string) {
  const usage = await getOwnedPlannerUsage(userId);

  if (usage.canCreate) {
    return usage;
  }

  throw new HttpError(409, buildPlannerLimitMessage(usage.currentTier, usage.plannerLimit), {
    details: {
      currentTier: usage.currentTier,
      activePlannerCount: usage.activePlannerCount,
      plannerLimit: usage.plannerLimit,
    },
  });
}
