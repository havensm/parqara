import {
  AuthProvider,
  OnboardingStatus,
  SubscriptionStatus,
  SubscriptionTier,
  TripStatus,
} from "@prisma/client/index";
import { subDays } from "date-fns";

import { BILLING_PLANS } from "@/lib/billing";
import { formatDateTime } from "@/lib/date-utils";
import { db } from "@/lib/db";

const activeSubscriptionStatuses = new Set<SubscriptionStatus>([
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
]);

const subscriptionTierOrder = [SubscriptionTier.FREE, SubscriptionTier.PLUS, SubscriptionTier.PRO] as const;
const tripStatusOrder = [TripStatus.DRAFT, TripStatus.PLANNED, TripStatus.LIVE, TripStatus.COMPLETED] as const;
const onboardingStatusOrder = [
  OnboardingStatus.NOT_STARTED,
  OnboardingStatus.IN_PROGRESS,
  OnboardingStatus.COMPLETED,
] as const;
const authProviderOrder = [AuthProvider.LOCAL, AuthProvider.GOOGLE] as const;

export type AdminDashboardMetrics = {
  generatedAt: string;
  overview: {
    totalUsers: number;
    verifiedUsers: number;
    onboardingCompletedUsers: number;
    activeSessions: number;
    totalTrips: number;
    totalCollaborations: number;
    tripsWithCollaborators: number;
    totalParks: number;
    totalAttractions: number;
  };
  growth: {
    usersLast7Days: number;
    usersLast30Days: number;
    tripsLast7Days: number;
    tripsLast30Days: number;
    completedTripsLast30Days: number;
  };
  ratios: {
    verificationRate: number;
    onboardingCompletionRate: number;
    paidConversionRate: number;
    tripCompletionRate30Days: number;
    avgTripsPerUser: number;
    avgCollaboratorsPerSharedTrip: number;
  };
  subscriptions: {
    activePaidUsers: number;
    estimatedMrr: number;
    breakdown: Array<{
      tier: SubscriptionTier;
      totalUsers: number;
      activeUsers: number;
      inactiveUsers: number;
    }>;
  };
  tripsByStatus: Array<{
    status: TripStatus;
    count: number;
  }>;
  onboardingByStatus: Array<{
    status: OnboardingStatus;
    count: number;
  }>;
  authProviders: Array<{
    provider: AuthProvider;
    count: number;
  }>;
  recentUsers: Array<{
    id: string;
    email: string;
    name: string;
    createdAt: string;
    subscriptionTier: SubscriptionTier;
    subscriptionStatus: SubscriptionStatus;
  }>;
  recentTrips: Array<{
    id: string;
    name: string;
    status: TripStatus;
    createdAt: string;
    visitDate: string;
    ownerEmail: string;
    parkName: string;
  }>;
};

function percentage(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function decimal(value: number) {
  return Number(value.toFixed(1));
}

function buildUserName(user: { firstName: string | null; lastName: string | null; name: string | null; email: string }) {
  const parts = [user.firstName, user.lastName].filter((value): value is string => Boolean(value && value.trim()));
  if (parts.length) {
    return parts.join(" ");
  }

  if (user.name?.trim()) {
    return user.name.trim();
  }

  return user.email;
}

function countFromMap<T extends string>(map: Map<T, number>, key: T) {
  return map.get(key) ?? 0;
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);

  const [
    totalUsers,
    verifiedUsers,
    onboardingCompletedUsers,
    activeSessions,
    totalTrips,
    totalCollaborations,
    tripsWithCollaborators,
    totalParks,
    totalAttractions,
    usersLast7Days,
    usersLast30Days,
    tripsLast7Days,
    tripsLast30Days,
    completedTripsLast30Days,
    tripStatusGroups,
    onboardingGroups,
    authProviderGroups,
    subscriptionUsers,
    collaboratorGroups,
    recentUsersRaw,
    recentTripsRaw,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({
      where: {
        emailVerifiedAt: {
          not: null,
        },
      },
    }),
    db.user.count({
      where: {
        onboardingStatus: OnboardingStatus.COMPLETED,
      },
    }),
    db.session.count({
      where: {
        expiresAt: {
          gt: now,
        },
      },
    }),
    db.trip.count(),
    db.tripCollaborator.count(),
    db.trip.count({
      where: {
        collaborators: {
          some: {},
        },
      },
    }),
    db.park.count(),
    db.attraction.count(),
    db.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    }),
    db.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    }),
    db.trip.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    }),
    db.trip.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    }),
    db.trip.count({
      where: {
        status: TripStatus.COMPLETED,
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    }),
    db.trip.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
    db.user.groupBy({
      by: ["onboardingStatus"],
      _count: {
        _all: true,
      },
    }),
    db.user.groupBy({
      by: ["authProvider"],
      _count: {
        _all: true,
      },
    }),
    db.user.findMany({
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    }),
    db.tripCollaborator.groupBy({
      by: ["tripId"],
      _count: {
        _all: true,
      },
    }),
    db.user.findMany({
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        createdAt: true,
        subscriptionTier: true,
        subscriptionStatus: true,
      },
    }),
    db.trip.findMany({
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        visitDate: true,
        user: {
          select: {
            email: true,
          },
        },
        park: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const tripStatusMap = new Map(tripStatusGroups.map((group) => [group.status, group._count._all]));
  const onboardingMap = new Map(onboardingGroups.map((group) => [group.onboardingStatus, group._count._all]));
  const authProviderMap = new Map(authProviderGroups.map((group) => [group.authProvider, group._count._all]));

  const subscriptionBreakdown = subscriptionTierOrder.map((tier) => {
    const usersOnTier = subscriptionUsers.filter((user) => user.subscriptionTier === tier);
    const activeUsers = usersOnTier.filter((user) => activeSubscriptionStatuses.has(user.subscriptionStatus)).length;

    return {
      tier,
      totalUsers: usersOnTier.length,
      activeUsers,
      inactiveUsers: usersOnTier.length - activeUsers,
    };
  });

  const activePaidUsers = subscriptionBreakdown
    .filter((item) => item.tier !== SubscriptionTier.FREE)
    .reduce((total, item) => total + item.activeUsers, 0);

  const estimatedMrr = subscriptionBreakdown.reduce((total, item) => {
    const plan = BILLING_PLANS[item.tier];
    return total + item.activeUsers * plan.monthlyPrice;
  }, 0);

  const avgCollaboratorsPerSharedTrip = collaboratorGroups.length
    ? decimal(collaboratorGroups.reduce((total, group) => total + group._count._all, 0) / collaboratorGroups.length)
    : 0;

  return {
    generatedAt: formatDateTime(now),
    overview: {
      totalUsers,
      verifiedUsers,
      onboardingCompletedUsers,
      activeSessions,
      totalTrips,
      totalCollaborations,
      tripsWithCollaborators,
      totalParks,
      totalAttractions,
    },
    growth: {
      usersLast7Days,
      usersLast30Days,
      tripsLast7Days,
      tripsLast30Days,
      completedTripsLast30Days,
    },
    ratios: {
      verificationRate: percentage(verifiedUsers, totalUsers),
      onboardingCompletionRate: percentage(onboardingCompletedUsers, totalUsers),
      paidConversionRate: percentage(activePaidUsers, totalUsers),
      tripCompletionRate30Days: percentage(completedTripsLast30Days, tripsLast30Days),
      avgTripsPerUser: totalUsers ? decimal(totalTrips / totalUsers) : 0,
      avgCollaboratorsPerSharedTrip,
    },
    subscriptions: {
      activePaidUsers,
      estimatedMrr,
      breakdown: subscriptionBreakdown,
    },
    tripsByStatus: tripStatusOrder.map((status) => ({
      status,
      count: countFromMap(tripStatusMap, status),
    })),
    onboardingByStatus: onboardingStatusOrder.map((status) => ({
      status,
      count: countFromMap(onboardingMap, status),
    })),
    authProviders: authProviderOrder.map((provider) => ({
      provider,
      count: countFromMap(authProviderMap, provider),
    })),
    recentUsers: recentUsersRaw.map((user) => ({
      id: user.id,
      email: user.email,
      name: buildUserName(user),
      createdAt: formatDateTime(user.createdAt),
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
    })),
    recentTrips: recentTripsRaw.map((trip) => ({
      id: trip.id,
      name: trip.name,
      status: trip.status,
      createdAt: formatDateTime(trip.createdAt),
      visitDate: formatDateTime(trip.visitDate),
      ownerEmail: trip.user.email,
      parkName: trip.park.name,
    })),
  };
}
