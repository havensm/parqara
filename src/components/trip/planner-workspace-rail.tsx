import Link from "next/link";
import { Archive, ArrowUpRight, Compass, FolderArchive } from "lucide-react";

import { getPlanByTier } from "@/lib/billing";
import type { DashboardTripDto, PlannerLimitStateDto, SubscriptionTierValue, TripStatusValue } from "@/lib/contracts";
import type { TripWorkspaceTab } from "@/lib/trip-workspace";
import { cn } from "@/lib/utils";

import { PlanBadge } from "@/components/billing/plan-badge";
import { PlannerWorkflowPanel } from "@/components/trip/planner-workflow-panel";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const statusAccent: Record<TripStatusValue, string> = {
  DRAFT: "bg-amber-400",
  PLANNED: "bg-teal-400",
  LIVE: "bg-sky-400",
  COMPLETED: "bg-slate-400",
};

export function PlannerWorkspaceRail({
  currentTier,
  plannerLimitState,
  tabs,
  activeTrip,
}: {
  currentTier: SubscriptionTierValue;
  plannerLimitState: PlannerLimitStateDto;
  tabs: Array<TripWorkspaceTab & { isActive?: boolean }>;
  activeTrip: {
    id: string;
    name: string;
    status: DashboardTripDto["status"];
    isOwner: boolean;
  };
}) {
  const currentPlan = getPlanByTier(currentTier);
  const usagePercent = Math.min(
    100,
    Math.round((plannerLimitState.activePlannerCount / Math.max(plannerLimitState.plannerLimit, 1)) * 100)
  );

  return (
    <div data-testid="planner-workspace-rail" className="space-y-4 lg:space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] bg-[radial-gradient(circle_at_top_left,rgba(99,167,255,0.16),transparent_34%),linear-gradient(180deg,rgba(248,252,255,0.98),rgba(255,255,255,0.98))] px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <PlanBadge tier={currentTier} />
            <span className="glass-chip px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {currentPlan.name}
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">Workspace access</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {currentTier === "FREE"
              ? "Free keeps manual planning open on one active planner."
              : currentTier === "PLUS"
                ? "Plus unlocks Mara across three active planners, with live mode and replans included."
                : "Pro keeps everything in Plus and adds more room plus stronger organization tools."}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <MetricPill label="Active planners" value={`${plannerLimitState.activePlannerCount}/${plannerLimitState.plannerLimit}`} />
            <MetricPill label="Mara" value={currentTier === "FREE" ? "Plus" : "Included"} />
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              <span>Planner capacity</span>
              <span>{usagePercent}% used</span>
            </div>
            <Progress value={usagePercent} className="mt-2.5" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 px-5 py-4">
          <Link href={currentTier === "FREE" ? "/pricing" : "/billing"} className={buttonStyles({ variant: "primary", size: "default" }) + " flex-1 justify-center sm:flex-none"}>
            {currentTier === "FREE" ? "See Plus" : "Open billing"}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/dashboard?create=1" className={buttonStyles({ variant: "secondary", size: "default" }) + " flex-1 justify-center sm:flex-none"}>
            <Compass className="mr-2 h-4 w-4" />
            New planner
          </Link>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Planner stack</p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Active and archived planners</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Keep the current trip in motion, archive older workspaces when you are at the limit, and restore them later when needed.
          </p>
        </div>

        <div className="space-y-3 px-5 py-5">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex items-center gap-3 rounded-[24px] border px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(28,198,170,0.2)] hover:bg-white",
                tab.isActive ? "border-[rgba(28,198,170,0.2)] bg-[linear-gradient(180deg,rgba(238,253,249,0.96),rgba(255,255,255,0.96))]" : "border-[var(--card-border)] bg-[var(--surface-muted)]"
              )}
            >
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", statusAccent[tab.status])} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">{tab.label}</p>
                <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{tab.parkName}</p>
              </div>
              {tab.isActive ? (
                <span className="rounded-full border border-teal-100 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-700)]">
                  Open
                </span>
              ) : null}
            </Link>
          ))}

          <div className="rounded-[24px] border border-dashed border-[var(--card-border)] bg-[var(--surface-muted)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <FolderArchive className="h-4 w-4 text-[var(--muted)]" />
              {plannerLimitState.archivedTrips.length} archived planners
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Archived planners do not count toward the active limit and can be restored from billing or settings when you need them again.
            </p>
            {plannerLimitState.archivedTrips.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {plannerLimitState.archivedTrips.slice(0, 3).map((trip) => (
                  <span key={trip.id} className="glass-chip px-3 py-1.5 text-xs font-medium text-[var(--muted)]">
                    {trip.name}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link href="/billing" className={buttonStyles({ variant: "secondary", size: "sm" })}>
                <Archive className="mr-2 h-4 w-4" />
                Manage archived
              </Link>
              {!plannerLimitState.canCreate ? (
                <Link href="/pricing" className={buttonStyles({ variant: "ghost", size: "sm" })}>
                  Compare plans
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <PlannerWorkflowPanel compact currentTier={currentTier} tripId={activeTrip.id} tripName={activeTrip.name} isOwner={activeTrip.isOwner} />
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--card-border)] bg-white/82 px-4 py-3 shadow-[0_10px_24px_rgba(12,20,37,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}




