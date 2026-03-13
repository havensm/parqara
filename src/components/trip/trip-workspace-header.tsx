import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";

import type { SubscriptionTierValue, TripStatusValue } from "@/lib/contracts";
import { formatTripPlannerStatusLabel } from "@/lib/trip-planner-agent";
import type { TripWorkspaceTab } from "@/lib/trip-workspace";
import { cn } from "@/lib/utils";

import { PlannerSectionKicker } from "@/components/trip/planner-section-kicker";
import { TripPlannerSettingsDialog } from "@/components/trip/trip-planner-settings-dialog";
import { Card } from "@/components/ui/card";

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
  createHref?: string;
  starterMode?: boolean;
  tabs: Array<TripWorkspaceTab & { isActive?: boolean }>;
};

export function TripWorkspaceHeader({
  currentTier,
  activeTrip,
  createHref = "/trips/new?fresh=1",
  starterMode = false,
  tabs,
}: TripWorkspaceHeaderProps) {
  return (
    <div>
      <div className="overflow-x-auto px-1">
        <div className="flex min-w-max items-end gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "group relative flex min-w-[190px] shrink-0 items-center justify-between gap-4 rounded-t-[22px] border border-b-0 px-4 py-3 transition",
                tab.isActive
                  ? "z-10 bg-[rgba(255,253,249,0.96)] text-slate-950 shadow-[0_-10px_30px_rgba(15,23,42,0.06)]"
                  : "bg-slate-100/90 text-slate-600 hover:bg-white hover:text-slate-950"
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{tab.label}</p>
                <p className={cn("mt-1 truncate text-xs", tab.isActive ? "text-slate-500" : "text-slate-400")}>{tab.parkName}</p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                  statusClassNames[tab.status]
                )}
              >
                {formatTripPlannerStatusLabel(tab.status)}
              </span>
            </Link>
          ))}

          <Link
            href={createHref}
            aria-label="Add a new trip planner"
            className="mb-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-600 transition hover:border-[#bfd4cb] hover:text-slate-950"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <Card className="-mt-px rounded-tl-[26px] p-0">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.14),transparent_34%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.96))] px-6 py-6 sm:px-7 sm:py-7">
          <PlannerSectionKicker emoji="🧭" label="Trip planner" tone="teal" />
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {starterMode ? "My first planner" : activeTrip.name}
                </h1>
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
                    statusClassNames[activeTrip.status]
                  )}
                >
                  {formatTripPlannerStatusLabel(activeTrip.status)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">{activeTrip.parkName}</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  <CalendarDays className="h-4 w-4 text-teal-700" />
                  {formatTripDate(activeTrip.visitDate)}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">{activeTrip.statusDetail}</span>
              </div>
            </div>

            <TripPlannerSettingsDialog
              currentTier={currentTier}
              tripId={activeTrip.id}
              tripName={activeTrip.name}
              isOwner={activeTrip.isOwner}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

