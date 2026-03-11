import type { ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, Footprints, Sparkles, TimerReset } from "lucide-react";

import type { SummaryDto } from "@/lib/contracts";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export function SummaryView({ summary }: { summary: SummaryDto }) {
  const efficiencyLabel =
    summary.metrics.efficiencyScore >= 90
      ? "High-efficiency day"
      : summary.metrics.efficiencyScore >= 75
        ? "Strong park day"
        : "Room to tighten the route";
  const rideCount = summary.completedItems.filter((item) => item.type === "RIDE").length;
  const breakCount = summary.completedItems.filter((item) => item.type === "BREAK").length;
  const diningCount = summary.completedItems.filter((item) => item.type === "DINING").length;

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8 lg:p-10">
        <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr] xl:items-start">
          <div>
            <Badge variant="success">Trip summary</Badge>
            <h1 className="mt-5 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold text-slate-950 sm:text-4xl lg:text-5xl">
              {summary.tripName}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{summary.latestPlanSummary}</p>
            <p className="mt-5 text-sm text-slate-500">{format(new Date(summary.visitDate), "EEEE, MMM d")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className={buttonStyles({ variant: "primary", size: "default" })}>
                Back to dashboard
              </Link>
              <Link href="/trips/new?fresh=1" className={buttonStyles({ variant: "secondary", size: "default" })}>
                Plan another trip
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-sky-100 bg-cyan-50 p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-teal-700/80">Efficiency score</p>
            <div className="mt-4 flex items-end gap-3 text-slate-950">
              <p className="text-6xl font-semibold sm:text-7xl">{summary.metrics.efficiencyScore}</p>
              <p className="pb-3 text-sm uppercase tracking-[0.24em] text-slate-500">out of 100</p>
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-950">{efficiencyLabel}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Based on completed attractions, expected wait efficiency, preserved priorities, and how much walking the route avoided.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <ScoreTile label="Rides" value={String(rideCount)} icon={<Sparkles className="h-4 w-4" />} />
              <ScoreTile label="Dining" value={String(diningCount)} icon={<CalendarDays className="h-4 w-4" />} />
              <ScoreTile label="Replans" value={String(summary.metrics.replanCount)} icon={<TimerReset className="h-4 w-4" />} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Rides completed" value={summary.metrics.ridesCompleted} />
          <Metric label="Time saved" value={`${summary.metrics.timeSavedMinutes}m`} />
          <Metric label="Average wait" value={`${summary.metrics.averagePredictedWait}m`} />
          <Metric label="Breaks logged" value={breakCount} />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <Card className="p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.28em] text-teal-700/80">Highlights</p>
            <div className="mt-5 space-y-3">
              {summary.highlights.map((highlight) => (
                <div key={highlight} className="rounded-[24px] border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-600">
                  {highlight}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.28em] text-teal-700/80">Day mix</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <MixTile label="Attractions" value={String(rideCount)} icon={<Sparkles className="h-4 w-4" />} />
              <MixTile label="Dining stops" value={String(diningCount)} icon={<CalendarDays className="h-4 w-4" />} />
              <MixTile label="Breaks" value={String(breakCount)} icon={<Footprints className="h-4 w-4" />} />
            </div>
          </Card>
        </div>

        <Card className="p-6 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-teal-700/80">Completed timeline</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">What the day actually covered</h2>
            </div>
            <p className="text-sm text-slate-500">Completed items are listed in the order the plan advanced.</p>
          </div>

          <div className="mt-6 space-y-4">
            {summary.completedItems.map((item, index) => (
              <div key={item.id} className="relative pl-10">
                {index < summary.completedItems.length - 1 ? (
                  <div className="absolute left-[15px] top-12 h-[calc(100%+1rem)] w-px bg-[#d7ddd4]" />
                ) : null}
                <div className="absolute left-0 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-950">
                  {index + 1}
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                        <Badge variant={item.type === "DINING" ? "success" : item.type === "BREAK" ? "warning" : "neutral"}>
                          {item.type}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {format(new Date(item.startTime), "h:mm a")} • {item.predictedWaitMinutes}m wait • {item.walkingMinutes}m walk
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{item.explanation}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 lg:min-w-[220px]">
                      <p className="font-semibold text-slate-950">Completion note</p>
                      <p className="mt-2">{item.reason}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MixTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3 text-slate-950">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ScoreTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-sky-100 bg-slate-50 p-4">
      <div className="flex items-center gap-3 text-slate-950">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}




