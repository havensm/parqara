import Image from "next/image";
import Link from "next/link";
import { CalendarDays, FolderArchive, Plus, Sparkles } from "lucide-react";

import type { SubscriptionTierValue, TripStatusValue } from "@/lib/contracts";
import { generatedVisuals } from "@/lib/generated-assets";
import { formatTripPlannerStatusLabel } from "@/lib/trip-planner-agent";
import type { TripWorkspaceTab } from "@/lib/trip-workspace";
import { cn } from "@/lib/utils";

import { PlanBadge } from "@/components/billing/plan-badge";
import { PlannerSectionKicker } from "@/components/trip/planner-section-kicker";
import { TripPlannerSettingsDialog } from "@/components/trip/trip-planner-settings-dialog";
import { buttonStyles } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const statusClassNames: Record<TripStatusValue, string> = {
  DRAFT: "border border-amber-200 bg-amber-50 text-amber-700",
  PLANNED: "border border-teal-200 bg-teal-50 text-teal-700",
  LIVE: "border border-cyan-200 bg-cyan-50 text-cyan-700",
  COMPLETED: "border border-slate-200 bg-slate-100 text-slate-600",
};

function formatTripDate(value: string) {
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

type TripWorkspaceHeaderProps = {
  currentTier: SubscriptionTierValue;
  activeTrip: {
    id: string;
    name: string;
    isOwner: boolean;
    parkName: string;
    visitDate: string;
    status: TripStatusValue;
    statusDetail: string;
  };
  plannerAllowance: {
    activeCount: number;
    limit: number;
    archivedCount: number;
  };
  createHref?: string;
  starterMode?: boolean;
  tabs: Array<TripWorkspaceTab & { isActive?: boolean }>;
  embedded?: boolean;
  showCreateAction?: boolean;
  showPlannerStack?: boolean;
};

export function TripWorkspaceHeader({
  currentTier,
  activeTrip,
  plannerAllowance,
  createHref = "/dashboard?create=1",
  starterMode = false,
  tabs,
  embedded = false,
  showCreateAction = true,
  showPlannerStack = true,
}: TripWorkspaceHeaderProps) {
  const allowancePercent = Math.min(100, Math.round((plannerAllowance.activeCount / Math.max(plannerAllowance.limit, 1)) * 100));

  return (
    <section
      className={cn(
        embedded
          ? "overflow-hidden rounded-[34px] border border-[var(--card-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(246,250,255,0.74))]"
          : "surface-shell overflow-hidden rounded-[38px]"
      )}
    >
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)]">
        <div className="border-b border-[var(--card-border)] px-5 py-5 sm:px-6 sm:py-6 xl:border-b-0 xl:border-r">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <PlannerSectionKicker emoji="🧭" label="Planner workspace" tone="teal" />
                <PlanBadge tier={currentTier} />
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
                    statusClassNames[activeTrip.status]
                  )}
                >
                  {formatTripPlannerStatusLabel(activeTrip.status)}
                </span>
              </div>

              <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-[2.7rem] sm:leading-[0.94]">
                {starterMode ? "My first planner" : activeTrip.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-[15px]">{activeTrip.statusDetail}</p>

              <div className="mt-4 flex flex-wrap gap-2.5 text-sm text-[var(--muted)]">
                <span className="glass-chip px-3.5 py-2">{activeTrip.parkName}</span>
                <span className="glass-chip inline-flex items-center gap-2 px-3.5 py-2">
                  <CalendarDays className="h-4 w-4 text-[var(--teal-700)]" />
                  {formatTripDate(activeTrip.visitDate)}
                </span>
                <span className="glass-chip px-3.5 py-2">{activeTrip.isOwner ? "Owner controls this planner" : "Shared planner access"}</span>
              </div>
            </div>

            <div className="flex w-full max-w-[28rem] flex-col gap-4 xl:items-end">
              <div className="grid gap-3 sm:grid-cols-3 xl:w-full">
                <HeaderStat label="Allowance" value={`${plannerAllowance.activeCount}/${plannerAllowance.limit}`} detail="active planners" />
                <HeaderStat label="Archived" value={String(plannerAllowance.archivedCount)} detail="saved off the board" />
                <HeaderStat label="Workspace" value={String(tabs.length)} detail="visible planner tabs" />
              </div>

              <div className="w-full rounded-[24px] border border-[var(--card-border)] bg-white/78 p-4 shadow-[0_14px_30px_rgba(12,20,37,0.08)]">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  <span>Planner capacity</span>
                  <span>{allowancePercent}% in use</span>
                </div>
                <Progress value={allowancePercent} className="mt-3" />
              </div>

              <div className="flex w-full flex-wrap gap-3 xl:justify-end">
                {showCreateAction ? (
                  <Link href={createHref} className={buttonStyles({ variant: "secondary", size: "default" })}>
                    <Plus className="mr-2 h-4 w-4" />
                    New planner
                  </Link>
                ) : null}
                <TripPlannerSettingsDialog
                  currentTier={currentTier}
                  tripId={activeTrip.id}
                  tripName={activeTrip.name}
                  isOwner={activeTrip.isOwner}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className={cn("relative overflow-hidden rounded-[30px] border border-white/50", embedded ? "min-h-[240px]" : "h-full min-h-[280px]")}>
            <Image
              src={generatedVisuals.planners.studio}
              alt="Planner workspace hero visual"
              fill
              sizes="(min-width: 1280px) 28vw, 100vw"
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,22,38,0.1)_0%,rgba(10,22,38,0.72)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <div className="rounded-[26px] border border-white/18 bg-[linear-gradient(180deg,rgba(10,22,38,0.78),rgba(10,22,38,0.92))] p-4 text-white shadow-[0_24px_54px_rgba(8,17,30,0.24)] backdrop-blur-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/65">Planner stack</p>
                <p className="mt-2 text-xl font-semibold">Active and archived workspaces stay visually clear.</p>
                <p className="mt-2 text-sm leading-6 text-white/72">Move between the active planner, archived planners, and workflow actions without losing your place.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPlannerStack ? (
        <div className="border-t border-[var(--card-border)] px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Planner stack</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Jump between active planners without leaving the workspace.</p>
            </div>
            <div className="glass-chip inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              <FolderArchive className="h-3.5 w-3.5 text-[var(--muted)]" />
              {plannerAllowance.archivedCount} archived
            </div>
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "group min-w-[230px] shrink-0 rounded-[26px] border px-4 py-4 transition duration-200",
                  tab.isActive
                    ? "border-[rgba(28,198,170,0.2)] bg-[linear-gradient(180deg,rgba(238,253,249,0.96),rgba(255,255,255,0.96))] shadow-[0_16px_30px_rgba(12,20,37,0.08)]"
                    : "border-[var(--card-border)] bg-white/76 hover:-translate-y-0.5 hover:border-[rgba(28,198,170,0.2)] hover:bg-white hover:shadow-[0_14px_28px_rgba(12,20,37,0.08)]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">{tab.label}</p>
                    <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{tab.parkName}</p>
                  </div>
                  {tab.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-teal-100 bg-white/92 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-700)]">
                      <Sparkles className="h-3 w-3" />
                      Open
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
                  <span>{formatTripDate(tab.visitDate)}</span>
                  <span className={cn("rounded-full px-2.5 py-1 font-semibold uppercase tracking-[0.18em]", statusClassNames[tab.status])}>
                    {formatTripPlannerStatusLabel(tab.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function HeaderStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--card-border)] bg-white/78 px-4 py-4 shadow-[0_12px_28px_rgba(12,20,37,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>
    </div>
  );
}

