"use client";

import Link from "next/link";
import { Archive, ArrowUpRight, LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { PlannerLimitStateDto } from "@/lib/contracts";

import { PlanBadge } from "@/components/billing/plan-badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function PlannerLimitCard({
  limitState,
  title = "You have reached your planner limit.",
  detail = "Archive an existing planner or upgrade your plan to open another active planner.",
}: {
  limitState: PlannerLimitStateDto;
  title?: string;
  detail?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingTripId, setPendingTripId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runPlannerAction(tripId: string, action: "archive" | "restore") {
    if (isPending) {
      return;
    }

    setPendingTripId(tripId);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/trips/${tripId}/${action}`, {
          method: "POST",
        });
        const result = (await response.json()) as { error?: string; nextPath?: string };
        if (!response.ok) {
          throw new Error(result.error || `Unable to ${action} this planner.`);
        }

        if (result.nextPath) {
          router.push(result.nextPath);
        } else {
          router.refresh();
        }
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : `Unable to ${action} this planner.`);
      } finally {
        setPendingTripId(null);
      }
    });
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_100%)] px-6 py-6 sm:px-7">
        <div className="flex flex-wrap items-center gap-3">
          <PlanBadge tier={limitState.currentTier} />
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
            {limitState.activePlannerCount} of {limitState.plannerLimit} active planners
          </span>
        </div>
        <h2 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{detail}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/pricing" className={buttonStyles({ variant: "primary", size: "default" })}>
            Upgrade plan
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
          <Link href="/pricing" className={buttonStyles({ variant: "secondary", size: "default" })}>
            Compare plans
          </Link>
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:p-7 xl:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Active planners</p>
          <div className="mt-4 space-y-3">
            {limitState.activeTrips.map((trip) => {
              const isWorking = pendingTripId === trip.id;

              return (
                <div key={trip.id} className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{trip.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {trip.parkName} • {trip.visitDate} • {trip.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => runPlannerAction(trip.id, "archive")}
                      disabled={isPending}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-[#bfd4cb] hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isWorking ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                      Archive
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Archived planners</p>
          <div className="mt-4 space-y-3">
            {limitState.archivedTrips.length ? (
              limitState.archivedTrips.map((trip) => {
                const isWorking = pendingTripId === trip.id;

                return (
                  <div key={trip.id} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="font-semibold text-slate-950">{trip.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {trip.parkName} • {trip.visitDate} • {trip.status}
                    </p>
                    <button
                      type="button"
                      onClick={() => runPlannerAction(trip.id, "restore")}
                      disabled={isPending}
                      className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-[#bfd4cb] hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isWorking ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                      Restore
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Archived planners will show up here once you move one out of the active workspace.
              </div>
            )}
          </div>
        </section>
      </div>

      {error ? <p className="px-6 pb-6 text-sm text-[#b14b41] sm:px-7">{error}</p> : null}
    </Card>
  );
}


