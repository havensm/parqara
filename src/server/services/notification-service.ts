import type { Prisma, NotificationSeverity, NotificationType } from "@prisma/client/index";

import type { AlertDto, NotificationCenterDto, NotificationDto, Severity, WeatherDto } from "@/lib/contracts";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http-error";

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

function toDbSeverity(severity: Severity): NotificationSeverity {
  if (severity === "critical") {
    return "CRITICAL";
  }

  if (severity === "warning") {
    return "WARNING";
  }

  return "INFO";
}

function fromDbSeverity(severity: NotificationSeverity): Severity {
  if (severity === "CRITICAL") {
    return "critical";
  }

  if (severity === "WARNING") {
    return "warning";
  }

  return "info";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function serializeNotification(
  notification: Prisma.NotificationGetPayload<{
    include: {
      actorUser: {
        select: {
          email: true;
          firstName: true;
          lastName: true;
          name: true;
        };
      };
      trip: {
        select: {
          id: true;
          name: true;
        };
      };
    };
  }>
): NotificationDto {
  return {
    id: notification.id,
    type: notification.type,
    severity: fromDbSeverity(notification.severity),
    title: notification.title,
    detail: notification.detail,
    actionHref: notification.actionHref ?? null,
    tripId: notification.tripId ?? null,
    tripName: notification.trip?.name ?? null,
    actorName: notification.actorUser ? buildUserDisplayName(notification.actorUser) : null,
    isRead: Boolean(notification.readAt),
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function listUserNotifications(userId: string, limit = 40): Promise<NotificationCenterDto> {
  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      include: {
        actorUser: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
        trip: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    db.notification.count({
      where: {
        userId,
        readAt: null,
      },
    }),
  ]);

  return {
    unreadCount,
    notifications: notifications.map(serializeNotification),
  };
}

export async function getNotificationPreview(userId: string, limit = 6): Promise<NotificationCenterDto> {
  return listUserNotifications(userId, limit);
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const result = await db.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  if (result.count === 0) {
    const existing = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new HttpError(404, "Notification not found.");
    }
  }

  return { ok: true };
}

export async function markAllNotificationsRead(userId: string) {
  const result = await db.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return { count: result.count, ok: true };
}

type CreateNotificationsInput = {
  userIds: string[];
  actorUserId?: string | null;
  tripId?: string | null;
  type: NotificationType;
  severity?: Severity;
  title: string;
  detail: string;
  actionHref?: string | null;
  dedupeKey?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

export async function createNotifications({
  userIds,
  actorUserId = null,
  tripId = null,
  type,
  severity = "info",
  title,
  detail,
  actionHref = null,
  dedupeKey = null,
  metadata = null,
}: CreateNotificationsInput) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueUserIds.length) {
    return;
  }

  await db.notification.createMany({
    data: uniqueUserIds.map((userId) => ({
      userId,
      actorUserId,
      tripId,
      type,
      severity: toDbSeverity(severity),
      title,
      detail,
      actionHref,
      dedupeKey,
      metadata: metadata ?? undefined,
    })),
    skipDuplicates: true,
  });
}

type TripMemberNotificationInput = Omit<CreateNotificationsInput, "userIds"> & {
  excludeUserIds?: string[];
};

export async function createTripMemberNotifications({ excludeUserIds = [], ...input }: TripMemberNotificationInput) {
  if (!input.tripId) {
    return;
  }

  const trip = await db.trip.findUnique({
    where: { id: input.tripId },
    select: {
      userId: true,
      collaborators: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!trip) {
    return;
  }

  const excluded = new Set(excludeUserIds.filter(Boolean));
  const userIds = [trip.userId, ...trip.collaborators.map((collaborator) => collaborator.userId)].filter((userId) => !excluded.has(userId));
  await createNotifications({
    ...input,
    userIds,
  });
}

function getWeatherNotificationSeverity(weather: WeatherDto): Severity {
  if (weather.rainChance >= 70 || /STORM|DOWNPOUR|HEAVY/i.test(weather.condition)) {
    return "critical";
  }

  if (weather.rainChance >= 40 || weather.condition !== "CLEAR") {
    return "warning";
  }

  return "info";
}

export async function createOperationalNotificationsForTrip({
  tripId,
  actorUserId,
  parkName,
  alerts,
  weather,
  actionHref,
}: {
  tripId: string;
  actorUserId?: string | null;
  parkName: string;
  alerts: AlertDto[];
  weather: WeatherDto;
  actionHref: string;
}) {
  for (const alert of alerts) {
    const type: NotificationType = /weather/i.test(`${alert.title} ${alert.detail}`) ? "WEATHER" : "RIDE_STATUS";
    await createTripMemberNotifications({
      tripId,
      actorUserId,
      type,
      severity: alert.severity,
      title: alert.title,
      detail: alert.detail,
      actionHref,
      dedupeKey: `trip:${tripId}:alert:${slugify(alert.title)}`,
      metadata: {
        alertTitle: alert.title,
        source: "live-operations",
      },
    });
  }

  if (weather.condition !== "CLEAR" || weather.rainChance >= 40) {
    await createTripMemberNotifications({
      tripId,
      actorUserId,
      type: "WEATHER",
      severity: getWeatherNotificationSeverity(weather),
      title: `${parkName} weather update`,
      detail: `${weather.condition.replaceAll("_", " ")} · ${weather.tempF}F · ${weather.rainChance}% rain chance. ${weather.summary}`,
      actionHref,
      dedupeKey: `trip:${tripId}:weather:${slugify(weather.condition)}:${Math.floor(weather.rainChance / 20)}`,
      metadata: {
        condition: weather.condition,
        rainChance: weather.rainChance,
        source: "weather",
      },
    });
  }
}

