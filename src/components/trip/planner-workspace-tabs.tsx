import Link from "next/link";
import { Plus } from "lucide-react";

import type { SubscriptionTierValue } from "@/lib/contracts";
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

function getCreateTabLabel(currentTier: SubscriptionTierValue, canCreate: boolean) {
  if (canCreate) {
    return "New plan";
  }

  if (currentTier === "FREE") {
    return "Upgrade";
  }

  return "Manage";
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
        <div className="flex min-h-[4rem] items-end gap-1.5 pb-px">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "group relative -mb-px flex min-w-[164px] shrink-0 flex-col rounded-t-[16px] border border-b-0 px-4 py-3 transition",
                tab.isActive
                  ? "border-[var(--card-border-strong)] bg-white text-[var(--foreground)]"
                  : "border-[rgba(124,149,182,0.18)] bg-[linear-gradient(180deg,#eff4fb_0%,#e9eef7_100%)] text-[var(--muted)] hover:bg-[linear-gradient(180deg,#f6f8fc_0%,#eef3fb_100%)] hover:text-[var(--foreground)]"
              )}
            >
              <p className="truncate text-sm font-semibold">{tab.label}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{formatTripDate(tab.visitDate)}</p>
            </Link>
          ))}

          <Link
            href={createHref}
            className={cn(
              "group relative -mb-px flex min-h-[4rem] min-w-[112px] shrink-0 items-center gap-2 rounded-t-[16px] border border-b-0 px-4 py-3 transition",
              canCreate
                ? "border-[rgba(23,183,162,0.22)] bg-[linear-gradient(180deg,#eefbf8_0%,#f8fffd_100%)] text-[var(--foreground)]"
                : "border-[rgba(244,182,73,0.24)] bg-[linear-gradient(180deg,#fff8eb_0%,#fffdf6_100%)] text-[var(--foreground)]"
            )}
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-semibold">{getCreateTabLabel(currentTier, canCreate)}</span>
          </Link>
        </div>
      </div>

      <p className="pb-3 text-sm text-[var(--muted)]">{activeCount}/{plannerLimit} active</p>
    </div>
  );
}
