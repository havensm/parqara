"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BellRing,
  CheckCheck,
  CloudRain,
  LoaderCircle,
  Plane,
  Route,
  Sparkles,
  TriangleAlert,
  Users2,
  type LucideIcon,
} from "lucide-react";

import type { AppNotificationTypeValue, NotificationCenterDto, NotificationDto } from "@/lib/contracts";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NotificationFeedMode = "compact" | "full";

type NotificationFeedProps = {
  initialCenter: NotificationCenterDto;
  mode?: NotificationFeedMode;
  onNavigate?: () => void;
  onCenterChange?: (center: NotificationCenterDto) => void;
};

type NotificationTypeMeta = {
  icon: LucideIcon;
  label: string;
  iconClassName: string;
};

const notificationTypeMeta: Record<AppNotificationTypeValue, NotificationTypeMeta> = {
  SYSTEM: {
    icon: Sparkles,
    label: "System",
    iconClassName: "bg-violet-100 text-violet-700",
  },
  TRAVEL: {
    icon: Plane,
    label: "Travel",
    iconClassName: "bg-sky-100 text-sky-700",
  },
  WEATHER: {
    icon: CloudRain,
    label: "Weather",
    iconClassName: "bg-blue-100 text-blue-700",
  },
  RIDE_STATUS: {
    icon: TriangleAlert,
    label: "Ride status",
    iconClassName: "bg-amber-100 text-amber-700",
  },
  PLANNER: {
    icon: Route,
    label: "Planner",
    iconClassName: "bg-teal-100 text-teal-700",
  },
  COLLABORATION: {
    icon: Users2,
    label: "Shared planner",
    iconClassName: "bg-emerald-100 text-emerald-700",
  },
};

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffMs = timestamp - Date.now();
  const absMinutes = Math.round(Math.abs(diffMs) / 60000);
  const formatter = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

  if (absMinutes < 1) {
    return "just now";
  }

  if (absMinutes < 60) {
    return formatter.format(Math.round(diffMs / 60000), "minute");
  }

  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) {
    return formatter.format(Math.round(diffMs / 3600000), "hour");
  }

  const absDays = Math.round(absHours / 24);
  if (absDays < 7) {
    return formatter.format(Math.round(diffMs / 86400000), "day");
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getSeverityVariant(severity: NotificationDto["severity"]): "critical" | "warning" | "info" {
  switch (severity) {
    case "critical":
      return "critical";
    case "warning":
      return "warning";
    default:
      return "info";
  }
}

function getSeverityLabel(severity: NotificationDto["severity"]) {
  switch (severity) {
    case "critical":
      return "Critical";
    case "warning":
      return "Warning";
    default:
      return "Info";
  }
}

function markNotificationAsRead(center: NotificationCenterDto, notificationId: string): NotificationCenterDto {
  let unreadDelta = 0;
  const notifications = center.notifications.map((notification) => {
    if (notification.id !== notificationId || notification.isRead) {
      return notification;
    }

    unreadDelta += 1;
    return {
      ...notification,
      isRead: true,
    };
  });

  return {
    unreadCount: Math.max(0, center.unreadCount - unreadDelta),
    notifications,
  };
}

function markAllNotificationsAsRead(center: NotificationCenterDto): NotificationCenterDto {
  return {
    unreadCount: 0,
    notifications: center.notifications.map((notification) => ({
      ...notification,
      isRead: true,
    })),
  };
}

export function NotificationFeed({ initialCenter, mode = "full", onNavigate, onCenterChange }: NotificationFeedProps) {
  const router = useRouter();
  const [center, setCenter] = useState(initialCenter);
  const [pendingNotificationId, setPendingNotificationId] = useState<string | null>(null);
  const [isMarkAllPending, setIsMarkAllPending] = useState(false);
  const isCompact = mode === "compact";

  useEffect(() => {
    setCenter(initialCenter);
  }, [initialCenter]);

  useEffect(() => {
    onCenterChange?.(center);
  }, [center, onCenterChange]);

  const counts = useMemo(() => {
    return center.notifications.reduce(
      (summary, notification) => {
        if (notification.type === "COLLABORATION" || notification.type === "PLANNER") {
          summary.planner += 1;
        } else if (notification.type === "WEATHER" || notification.type === "RIDE_STATUS") {
          summary.operations += 1;
        } else if (notification.type === "TRAVEL") {
          summary.travel += 1;
        } else {
          summary.system += 1;
        }

        return summary;
      },
      { planner: 0, operations: 0, travel: 0, system: 0 }
    );
  }, [center.notifications]);

  async function postJson(url: string) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(result.error || "Unable to update notifications.");
    }
  }

  async function handleMarkRead(notificationId: string) {
    if (pendingNotificationId || isMarkAllPending) {
      return false;
    }

    const previous = center;
    setPendingNotificationId(notificationId);
    setCenter((current) => markNotificationAsRead(current, notificationId));

    try {
      await postJson(`/api/notifications/${notificationId}/read`);
      return true;
    } catch {
      setCenter(previous);
      router.refresh();
      return false;
    } finally {
      setPendingNotificationId(null);
    }
  }

  async function handleMarkAllRead() {
    if (center.unreadCount === 0 || isMarkAllPending || pendingNotificationId) {
      return;
    }

    const previous = center;
    setIsMarkAllPending(true);
    setCenter((current) => markAllNotificationsAsRead(current));

    try {
      await postJson("/api/notifications/read-all");
    } catch {
      setCenter(previous);
      router.refresh();
    } finally {
      setIsMarkAllPending(false);
    }
  }

  async function handleOpenNotification(notification: NotificationDto) {
    if (!notification.isRead) {
      await handleMarkRead(notification.id);
    }

    onNavigate?.();
    router.push(notification.actionHref ?? "/notifications");
  }

  function handleOpenInbox() {
    onNavigate?.();
    router.push("/notifications");
  }

  if (!center.notifications.length) {
    return (
      <div className={cn("rounded-[28px] border border-dashed border-slate-200 bg-white/85 p-6 text-center", isCompact ? "p-5" : "p-8")}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-slate-100 text-slate-500">
          <BellRing className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-950">No notifications yet</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Planner activity, ride closures, weather updates, and future travel alerts all land here once they start happening.
        </p>
        {!isCompact ? (
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Shared planner edits</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Ride status changes</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Weather shifts</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Travel delays</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", isCompact ? "space-y-3" : "space-y-6")}>
      {!isCompact ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Unread" value={String(center.unreadCount)} tone="teal" />
          <SummaryCard label="Planner" value={String(counts.planner)} tone="emerald" />
          <SummaryCard label="Operations" value={String(counts.operations)} tone="amber" />
          <SummaryCard label="Travel / system" value={String(counts.travel + counts.system)} tone="sky" />
        </div>
      ) : null}

      <div className={cn("rounded-[30px] border border-slate-200 bg-white/90", isCompact ? "p-3" : "p-4 sm:p-5")}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Notification inbox</p>
            <p className="mt-1 text-sm text-slate-500">
              {center.unreadCount > 0 ? `${center.unreadCount} unread` : "Everything is caught up"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={center.unreadCount === 0 || isMarkAllPending}>
              {isMarkAllPending ? (
                <>
                  <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Updating
                </>
              ) : (
                <>
                  <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                  Mark all read
                </>
              )}
            </Button>
            {isCompact ? (
              <Button type="button" variant="secondary" size="sm" onClick={handleOpenInbox}>
                View inbox
              </Button>
            ) : null}
          </div>
        </div>

        <div className={cn("mt-4", isCompact ? "space-y-2.5" : "space-y-3")}>
          {center.notifications.map((notification) => {
            const typeMeta = notificationTypeMeta[notification.type];
            const Icon = typeMeta.icon;
            const isPending = pendingNotificationId === notification.id;

            return (
              <div
                key={notification.id}
                className={cn(
                  "rounded-[24px] border p-4 transition",
                  notification.isRead
                    ? "border-slate-200 bg-slate-50/80"
                    : "border-teal-200 bg-[linear-gradient(180deg,rgba(240,253,250,0.98),rgba(255,255,255,0.98))] shadow-[0_14px_26px_rgba(15,23,42,0.04)]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]", typeMeta.iconClassName)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{notification.title}</p>
                      {!notification.isRead ? <Badge variant="success">New</Badge> : null}
                      <Badge variant={getSeverityVariant(notification.severity)}>{getSeverityLabel(notification.severity)}</Badge>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                        {typeMeta.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{notification.detail}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
                      {notification.actorName ? <span>From {notification.actorName}</span> : null}
                      {notification.tripName ? <span>{notification.tripName}</span> : null}
                      <span>{formatRelativeTime(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {notification.actionHref ? (
                    <Button type="button" variant="secondary" size="sm" onClick={() => void handleOpenNotification(notification)}>
                      <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />
                      Open
                    </Button>
                  ) : null}
                  {!notification.isRead ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => void handleMarkRead(notification.id)} disabled={isPending}>
                      {isPending ? (
                        <>
                          <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Saving
                        </>
                      ) : (
                        <>
                          <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                          Mark read
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "teal" | "emerald" | "amber" | "sky" }) {
  const toneClassNames = {
    teal: "bg-[linear-gradient(180deg,#eefbf8_0%,#ffffff_100%)]",
    emerald: "bg-[linear-gradient(180deg,#eefaf2_0%,#ffffff_100%)]",
    amber: "bg-[linear-gradient(180deg,#fff7ea_0%,#ffffff_100%)]",
    sky: "bg-[linear-gradient(180deg,#eef7ff_0%,#ffffff_100%)]",
  } as const;

  return (
    <div className={cn("rounded-[24px] border border-slate-200 p-4", toneClassNames[tone])}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
