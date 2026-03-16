import { BellRing, CloudRain, Plane, Users2 } from "lucide-react";

import { isAdminEmail } from "@/lib/admin";
import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import { getUserBillingState } from "@/lib/billing";
import type { NotificationDto } from "@/lib/contracts";
import { listUserNotifications } from "@/server/services/notification-service";

import { AppShell } from "@/components/app/app-shell";
import { NotificationFeed } from "@/components/notifications/notification-feed";

export default async function NotificationsPage() {
  const user = await requireCompletedOnboardingUser();
  const billing = getUserBillingState(user);
  const adminEnabled = isAdminEmail(user.email);
  const center = await listUserNotifications(user.id, 50);
  const plannerCount = center.notifications.filter(
    (notification: NotificationDto) => notification.type === "PLANNER" || notification.type === "COLLABORATION"
  ).length;
  const operationsCount = center.notifications.filter(
    (notification: NotificationDto) => notification.type === "WEATHER" || notification.type === "RIDE_STATUS"
  ).length;
  const travelCount = center.notifications.filter((notification: NotificationDto) => notification.type === "TRAVEL").length;

  return (
    <AppShell
      eyebrow="Notification inbox"
      title="Planner and live alerts."
      description="Shared edits, ride changes, weather, and travel alerts land here."
      actionHref="/dashboard"
      actionLabel="Back to dashboard"
      icon={<BellRing className="h-6 w-6" />}
      currentTier={billing.currentTier}
      adminEnabled={adminEnabled}
      highlights={[
        { icon: <Users2 className="h-4 w-4" />, label: "Shared planner edits" },
        { icon: <CloudRain className="h-4 w-4" />, label: "Ride and weather changes" },
        { icon: <Plane className="h-4 w-4" />, label: "Travel alerts when connected" },
      ]}
      visual={
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <InboxVisualCard label="Unread" value={String(center.unreadCount)} tone="teal" />
          <InboxVisualCard label="Planner updates" value={String(plannerCount)} tone="emerald" />
          <InboxVisualCard label="Operations / travel" value={String(operationsCount + travelCount)} tone="sky" />
        </div>
      }
    >
      <NotificationFeed initialCenter={center} />
    </AppShell>
  );
}

function InboxVisualCard({ label, value, tone }: { label: string; value: string; tone: "emerald" | "sky" | "teal" }) {
  const toneClassNames = {
    emerald: "bg-[linear-gradient(180deg,#eefaf2_0%,#ffffff_100%)]",
    sky: "bg-[linear-gradient(180deg,#eef7ff_0%,#ffffff_100%)]",
    teal: "bg-[linear-gradient(180deg,#eefbf8_0%,#ffffff_100%)]",
  } as const;

  return (
    <div className={`rounded-[24px] border border-slate-200 p-5 ${toneClassNames[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
