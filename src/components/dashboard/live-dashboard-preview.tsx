import type { ReactNode } from "react";
import { Gauge, Lock, MapPinned, Route, TimerReset } from "lucide-react";

import type { TripDetailDto } from "@/lib/contracts";
import type { SubscriptionTierValue } from "@/lib/contracts";

import { FeatureUpsellCard } from "@/components/billing/feature-upsell-card";
import { PlanBadge } from "@/components/billing/plan-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LiveDashboardPreview({ trip, currentTier }: { trip: TripDetailDto; currentTier: SubscriptionTierValue }) {
  const previewItems = trip.itinerary.slice(0, 3);

  return (
    <div className="space-y-6">
      <FeatureUpsellCard feature="liveDashboard" currentTier={currentTier} />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <PlanBadge tier="PLUS" />
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">Preview only</span>
              </div>
              <h1 className="mt-5 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold text-slate-950 sm:text-4xl lg:text-5xl">
                {trip.name}
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                Unlock live park mode to watch the next best move, current waits, and replans adjust around the day as it unfolds.
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
              <p>Live readiness</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">Locked</p>
              <p className="mt-2">Upgrade required</p>
            </div>
          </div>

          <div className="mt-8 rounded-[32px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-teal-700/80">Recommended next move</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-950">Live recommendation preview</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-500">
                <Lock className="h-4 w-4" />
                Hidden on Free
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[#4f625d]">
              Plus watches current waits, weather shifts, and attraction availability before suggesting the next move.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <PreviewTile label="Wait" value="Live" icon={<TimerReset className="h-4 w-4" />} />
              <PreviewTile label="Walk" value="Adaptive" icon={<Route className="h-4 w-4" />} />
              <PreviewTile label="Zone" value={trip.park.name} icon={<MapPinned className="h-4 w-4" />} />
              <PreviewTile label="Confidence" value="Updated" icon={<Gauge className="h-4 w-4" />} />
            </div>
          </div>
        </Card>

        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <Card className="p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-teal-700/80">Controls</p>
            <div className="mt-5 space-y-3">
              <Button className="w-full" disabled>
                Ride completed
              </Button>
              <Button className="w-full" variant="secondary" disabled>
                Replan now
              </Button>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-500">Plus unlocks live controls so the route can adapt while you are in the park.</p>
          </Card>

          <Card className="p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-teal-700/80">What Plus adds</p>
            <div className="mt-5 space-y-3">
              {[
                "Live condition monitoring",
                "Fast replans when waits spike",
                "A dedicated in-park control surface",
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <Card className="p-6 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-teal-700/80">Route queue</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Preview of the next route slots</h2>
          </div>
          <p className="text-sm text-slate-500">Live reshuffling stays locked until Plus is active.</p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {(previewItems.length ? previewItems : trip.itinerary).slice(0, 3).map((item) => (
            <div key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-slate-950">{item.title}</p>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.type}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.explanation}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PreviewTile({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
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

