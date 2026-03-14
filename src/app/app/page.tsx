import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  Compass,
  CreditCard,
  FolderKanban,
  Route,
  Sparkles,
  UserCircle2,
  type LucideIcon,
} from "lucide-react";

import { getUserBillingState } from "@/lib/billing";
import { isAdminEmail } from "@/lib/admin";
import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import { type DashboardTripDto } from "@/lib/contracts";

import { buildPreferenceSummary } from "@/lib/onboarding";
import { formatTripPlannerStatusLabel } from "@/lib/trip-planner-agent";
import { getTripWorkspaceHref, pickDefaultTrip } from "@/lib/trip-workspace";
import { getNotificationPreview } from "@/server/services/notification-service";
import { getPlannerLimitState } from "@/server/services/planner-entitlement-service";
import { getDefaultParkSummary, listDashboardTrips } from "@/server/services/trip-service";
import { getOnboardingState } from "@/server/services/user-service";

import { AppShell } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/empty-state";
import { PreferenceSummary } from "@/components/app/preference-summary";
import { NotificationFeed } from "@/components/notifications/notification-feed";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";


type HomeAction = {
  href: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  tone: "amber" | "sky" | "teal" | "violet";
};

const actionToneClassNames: Record<HomeAction["tone"], string> = {
  amber: "bg-[rgba(255,248,235,0.96)] text-[var(--amber-700)]",
  sky: "bg-[rgba(239,245,255,0.92)] text-[var(--sky-700)]",
  teal: "bg-[rgba(238,253,249,0.92)] text-[var(--teal-700)]",
  violet: "bg-[rgba(246,240,255,0.92)] text-[#6d4fd6]",
};

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

function getUpcomingTrips(trips: DashboardTripDto[]) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const upcoming = [...trips]
    .filter((trip) => trip.visitDate >= todayKey)
    .sort((left, right) => left.visitDate.localeCompare(right.visitDate));

  return upcoming.length ? upcoming : [...trips].sort((left, right) => left.visitDate.localeCompare(right.visitDate));
}

export default async function AppPage() {
  const user = await requireCompletedOnboardingUser();
  const adminEnabled = isAdminEmail(user.email);
  const billing = getUserBillingState(user);
  const [onboarding, trips, defaultPark, plannerLimitState, notificationPreview] = await Promise.all([
    getOnboardingState(user.id),
    listDashboardTrips(user.id),
    getDefaultParkSummary(),
    getPlannerLimitState(user.id),
    getNotificationPreview(user.id, 4),
  ]);

  const firstName = user.firstName ?? user.name ?? "there";
  const summaryItems = buildPreferenceSummary(onboarding.values);
  const upcomingTrips = getUpcomingTrips(trips);
  const featuredTrips = upcomingTrips.slice(0, 4);
  const currentFocusTrip = pickDefaultTrip(upcomingTrips.length ? upcomingTrips : trips);
  const unreadNotification = notificationPreview.notifications.find((notification) => !notification.isRead) ?? notificationPreview.notifications[0] ?? null;
  const canCreatePlanner = plannerLimitState.canCreate && Boolean(defaultPark);

  const nextMoves: HomeAction[] = [
    currentFocusTrip
      ? {
          href: getTripWorkspaceHref(currentFocusTrip),
          title: currentFocusTrip.status === "DRAFT" ? "Continue your active draft" : "Pick up your current planner",
          detail: currentFocusTrip.latestPlanSummary ?? `${currentFocusTrip.parkName} is ready for the next planning move.`,
          icon: Route,
          tone: "teal",
        }
      : {
          href: "/dashboard",
          title: "Open planner workspace",
          detail: "Jump into the planner board and start shaping the next outing with Mara.",
          icon: FolderKanban,
          tone: "teal",
        },
    canCreatePlanner
      ? {
          href: "/trips/new?fresh=1",
          title: "Start a new planner",
          detail: `Open a fresh planner for ${defaultPark?.name ?? "your next destination"} and carry your defaults forward.`,
          icon: Sparkles,
          tone: "sky",
        }
      : {
          href: billing.currentTier === "FREE" ? "/pricing" : "/billing",
          title: "Manage planner space",
          detail: `You are using ${plannerLimitState.activePlannerCount} of ${plannerLimitState.plannerLimit} active planner slots.`,
          icon: CreditCard,
          tone: "amber",
        },
    {
      href: unreadNotification?.actionHref ?? "/notifications",
      title: unreadNotification ? "Handle the next alert" : "Review your inbox",
      detail: unreadNotification ? unreadNotification.title : "Stay on top of planner, travel, and shared-trip activity.",
      icon: BellRing,
      tone: "amber",
    },
    {
      href: "/calendar",
      title: "See the month ahead",
      detail: `${upcomingTrips.length} trip${upcomingTrips.length === 1 ? "" : "s"} lined up across your calendar and planners.`,
      icon: CalendarClock,
      tone: "violet",
    },
    {
      href: "/profile",
      title: "Refresh account defaults",
      detail: "Keep your name, profile image, preferences, and planning style current.",
      icon: UserCircle2,
      tone: "sky",
    },
  ];

  return (
    <AppShell
      eyebrow="Account home"
      title={`Welcome back, ${firstName}.`}
      description="This is the signed-in home for Parqara: upcoming trips, inbox activity, planner momentum, current plan access, and the fastest path back into Mara-guided planning."
      actionHref={canCreatePlanner ? "/trips/new?fresh=1" : "/dashboard"}
      actionLabel={canCreatePlanner ? "Start a new planner" : "Open planners"}
      secondaryActionHref="/calendar"
      secondaryActionLabel="Open calendar"
      icon={<Compass className="h-6 w-6" />}
      currentTier={billing.currentTier}
      adminEnabled={adminEnabled}
      highlights={[
        { icon: <FolderKanban className="h-4 w-4" />, label: `${plannerLimitState.activePlannerCount} active planners` },
        { icon: <BellRing className="h-4 w-4" />, label: `${notificationPreview.unreadCount} unread notifications` },
        { icon: <CalendarClock className="h-4 w-4" />, label: `${upcomingTrips.length} upcoming trip${upcomingTrips.length === 1 ? "" : "s"}` },
      ]}

    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <HomeMetricCard label="Upcoming" value={String(upcomingTrips.length)} detail="Trips on the calendar" />
        <HomeMetricCard label="Inbox" value={String(notificationPreview.unreadCount)} detail="Unread notifications" />
        <HomeMetricCard label="Active planners" value={`${plannerLimitState.activePlannerCount}/${plannerLimitState.plannerLimit}`} detail="Planner capacity" />
        <HomeMetricCard label="Defaults" value={String(summaryItems.length || 1)} detail="Saved account signals" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <Card className="overflow-hidden p-0">
          <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-6 sm:px-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Next moves</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              The fastest useful actions are right here.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              Jump back into the current planner, start another one, clear inbox activity, or tighten the account defaults that guide every plan.
            </p>
          </div>
          <div className="grid gap-3 p-6 sm:p-7">
            {nextMoves.map((item) => (
              <Link key={item.title} href={item.href} className="premium-card-tilt rounded-[28px] border border-[var(--card-border)] bg-white/72 px-5 py-5 transition hover:bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${actionToneClassNames[item.tone]}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{item.title}</p>
                      <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--muted)]">{item.detail}</p>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-[var(--muted)]" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="bg-[linear-gradient(180deg,#f8fcfb_0%,#ffffff_100%)] px-6 py-6 sm:px-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Notifications</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              Your account inbox at a glance.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              See the latest planner, travel, and shared-trip updates without leaving the home page.
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <NotificationFeed initialCenter={notificationPreview} mode="compact" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
        <PreferenceSummary items={summaryItems.length ? summaryItems : ["Your account defaults are saved and ready for the next planner"]} />

        <Card className="overflow-hidden p-0">
          <div className="bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_100%)] px-6 py-6 sm:px-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Planner pulse</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              What your account is tracking right now.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              Keep one eye on planner mix, current focus, and where Mara or the route likely needs attention next.
            </p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-7">
            <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Current focus</p>
              {currentFocusTrip ? (
                <>
                  <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">{currentFocusTrip.name}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{currentFocusTrip.parkName} · {formatVisitDate(currentFocusTrip.visitDate)}</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{currentFocusTrip.latestPlanSummary ?? "Open this planner to keep moving the route forward."}</p>
                  <Link href={getTripWorkspaceHref(currentFocusTrip)} className={buttonStyles({ variant: "secondary", size: "sm" }) + " mt-4"}>
                    Open current focus
                  </Link>
                </>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">No planner is active yet. Start one and it will become the account focus here.</p>
              )}
            </div>
            <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Status mix</p>
              <div className="mt-4 space-y-3">
                <StatusRow label="Draft" value={trips.filter((trip) => trip.status === "DRAFT").length} />
                <StatusRow label="Planned" value={trips.filter((trip) => trip.status === "PLANNED").length} />
                <StatusRow label="Live" value={trips.filter((trip) => trip.status === "LIVE").length} />
                <StatusRow label="Completed" value={trips.filter((trip) => trip.status === "COMPLETED").length} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {featuredTrips.length ? (
        <Card className="overflow-hidden p-0">
          <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-6 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Upcoming trips</p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                  Your next adventures, all in reach.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                  Open the planner, jump into the calendar, or use these upcoming trips as the quickest way back into active planning.
                </p>
              </div>
              <Link href="/dashboard" className={buttonStyles({ variant: "secondary", size: "default" })}>
                View all planners
              </Link>
            </div>
          </div>
          <div className="grid gap-3 p-6 md:grid-cols-2 xl:grid-cols-4 sm:p-7">
            {featuredTrips.map((trip) => (
              <Link key={trip.id} href={getTripWorkspaceHref(trip)} className="premium-card-tilt rounded-[26px] border border-[var(--card-border)] bg-white/72 p-4 transition hover:bg-white">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[var(--card-border)] bg-[var(--surface-muted)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {formatTripPlannerStatusLabel(trip.status)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[var(--muted)]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--foreground)]">{trip.name}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{trip.parkName}</p>
                <p className="mt-3 text-sm text-[var(--muted)]">{formatVisitDate(trip.visitDate)}</p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{trip.latestPlanSummary ?? "Open this planner to keep shaping the route and next moves."}</p>
              </Link>
            ))}
          </div>
        </Card>
      ) : canCreatePlanner ? (
        <EmptyState
          eyebrow="No trips yet"
          title="Your signed-in home is ready for its first planner."
          description="Start a planner and this page will begin showing upcoming trips, next moves, and the account signals that matter most."
          actionHref="/trips/new?fresh=1"
          actionLabel="Start the first planner"
        />
      ) : (
        <Card className="p-6 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Planner setup</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Planner creation is waiting on catalog access.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            As soon as a park or destination catalog is configured, your home page will start filling with upcoming planners and live trip activity.
          </p>
        </Card>
      )}
    </AppShell>
  );
}

function HomeMetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">{label}</p>
      <p className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-[var(--foreground)]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
    </Card>
  );
}

function StatusRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--card-border)] bg-white/72 px-4 py-3">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}







