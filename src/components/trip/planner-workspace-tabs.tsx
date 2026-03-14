import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

import type { SubscriptionTierValue } from "@/lib/contracts";
import { formatTripPlannerStatusLabel } from "@/lib/trip-planner-agent";
import type { TripWorkspaceTab } from "@/lib/trip-workspace";
import { cn } from "@/lib/utils";

function formatTripDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getCreateTabLabel(currentTier: SubscriptionTierValue, canCreate: boolean, plannerLimit: number, activeCount: number) {
  if (canCreate) {
    const remaining = Math.max(plannerLimit - activeCount, 0);
    return remaining === 1 ? "1 slot left" : `${remaining} slots left`;
  }

  if (currentTier === "FREE") {
    return "Upgrade for more";
  }

  if (currentTier === "PLUS") {
    return "Archive or go Pro";
  }

  return "Archive to reopen";
}

export function PlannerWorkspaceTabs({
  tabs,
  currentTier,
  activeCount,
  plannerLimit,
  canCreate,
  createHref,
}: {
  tabs: Array<TripWorkspaceTab & { isActive?: boolean }>;
  currentTier: SubscriptionTierValue;
  activeCount: number;
  plannerLimit: number;
  canCreate: boolean;
  createHref: string;
}) {
  return (
    <div data-testid="planner-workspace-tabs" className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 flex-1 overflow-x-auto pb-0 soft-scrollbar">
        <div className="flex min-h-[4.25rem] items-end gap-1.5 pb-px">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "group relative -mb-px flex min-w-[188px] shrink-0 flex-col rounded-t-[18px] border border-b-0 px-4 py-3 transition duration-200",
                tab.isActive
                  ? "border-[var(--card-border-strong)] bg-white text-[var(--foreground)] shadow-[0_-8px_24px_rgba(12,20,37,0.04)]"
                  : "border-[rgba(124,149,182,0.18)] bg-[linear-gradient(180deg,#eef4fb_0%,#e7edf7_100%)] text-[var(--foreground)] hover:bg-[linear-gradient(180deg,#f4f8fd_0%,#edf3fb_100%)]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{tab.label}</p>
                  <p className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{tab.parkName}</p>
                </div>
                {tab.isActive ? (
                  <span className="rounded-full border border-[rgba(23,183,162,0.18)] bg-[rgba(238,253,249,0.96)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-700)]">
                    Open
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-[var(--muted)]">
                <span>{formatTripDate(tab.visitDate)}</span>
                <span className="truncate rounded-full border border-[var(--card-border)] bg-[var(--surface-muted)] px-2.5 py-1 font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                  {formatTripPlannerStatusLabel(tab.status)}
                </span>
              </div>
            </Link>
          ))}

          <Link
            href={createHref}
            className={cn(
              "group relative -mb-px flex min-h-[4.25rem] min-w-[124px] shrink-0 flex-col justify-center rounded-t-[18px] border border-b-0 px-4 py-3 transition duration-200",
              canCreate
                ? "border-[rgba(23,183,162,0.22)] bg-[linear-gradient(180deg,#eefbf8_0%,#f7fffd_100%)] hover:bg-[linear-gradient(180deg,#f4fffc_0%,#ffffff_100%)]"
                : "border-[rgba(244,182,73,0.24)] bg-[linear-gradient(180deg,#fff8eb_0%,#fffdf6_100%)]"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border",
                  canCreate
                    ? "border-[rgba(23,183,162,0.18)] bg-white text-[var(--teal-700)]"
                    : "border-[rgba(244,182,73,0.2)] bg-white text-[var(--amber-700)]"
                )}
              >
                <Plus className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">New</p>
                <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">{getCreateTabLabel(currentTier, canCreate, plannerLimit, activeCount)}</p>
              </div>
              {!canCreate ? <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-[var(--muted)]" /> : null}
            </div>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-3 lg:justify-end">
        <span className="rounded-full border border-[var(--card-border)] bg-white px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          {activeCount} of {plannerLimit} active
        </span>
        <span className="rounded-full border border-[var(--card-border)] bg-white px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Free 1 · Plus 3 · Pro 10
        </span>
      </div>
    </div>
  );
}
