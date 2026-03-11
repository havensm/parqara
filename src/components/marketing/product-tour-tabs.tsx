"use client";

import { Compass, Route, ShieldCheck, TimerReset } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const planSteps = [
  "Pick a date and name the adventure.",
  "Set group size, thrill comfort, and walking tolerance.",
  "Lock must-do rides and food preferences.",
];

const liveAlerts = [
  "Harbor Drop is temporarily delayed.",
  "Comet Run wait fell by 18 minutes.",
  "Rain chance at 4:30 PM may affect outdoor queues.",
];

const reviewHighlights = [
  "42 minutes of queue time avoided",
  "2 park crossings prevented by routing",
  "3 headliners protected despite a replan",
];

export function ProductTourTabs() {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.96)_100%)] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
      <Tabs defaultValue="plan" className="w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/80">Product tour</p>
            <h2 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
              A cleaner planning flow from first question to live guidance.
            </h2>
          </div>
          <TabsList>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="guide">Guide</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="plan">
          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Guided planner</p>
                  <p className="mt-3 text-2xl font-semibold">Question 5 of 8</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-100">
                  Auto-saved
                </div>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
                The wizard asks one thing at a time, keeps the cognitive load low, and stores every answer on the draft trip immediately.
              </p>
              <Progress value={62.5} className="mt-6 bg-white/10" />
              <div className="mt-6 space-y-3">
                {planSteps.map((step) => (
                  <div key={step} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    {step}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">What gets saved</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">A real draft, not browser-only progress</p>
                </div>
              </div>
              <Separator className="my-5" />
              <div className="grid gap-3">
                <FeatureRow title="Party profile" detail="Kids ages, thrill comfort, walking appetite, and pacing." />
                <FeatureRow title="Adventure constraints" detail="Must-do rides, start time, breaks, and dining preferences." />
                <FeatureRow title="Resume state" detail="Current question index saved so the flow reopens where it stopped." />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="guide">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Live park state</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">A route that keeps adjusting.</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Instead of forcing the user to rethink the whole day, Parqara surfaces the next best move with the latest queue and alert context attached.
              </p>
              <div className="mt-5 space-y-3">
                {liveAlerts.map((alert) => (
                  <div key={alert} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {alert}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ecfeff_0%,#ffffff_100%)] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-teal-700/70">Recommended next move</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">Swap to Comet Run now</p>
                </div>
                <div className="rounded-full border border-teal-200 bg-white px-3 py-1 text-sm font-semibold text-teal-700">91% confidence</div>
              </div>
              <Separator className="my-5" />
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricPill label="Wait" value="24m" />
                <MetricPill label="Walk" value="6m" />
                <MetricPill label="Reason" value="Lower queue now" />
              </div>
              <div className="mt-5 rounded-[24px] border border-teal-100 bg-white p-5">
                <div className="flex items-center gap-3 text-slate-950">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
                    <Route className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Live guidance with context</p>
                    <p className="text-sm text-slate-500">Wait, walk, alerts, and rationale stay attached to the recommendation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="review">
          <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Trip review</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">The day should end with a readable summary.</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Users can see what the planner protected, how the route performed, and where time was saved after the park day is done.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MetricPill label="Score" value="92" />
                <MetricPill label="Replans" value="2" />
                <MetricPill label="Rides" value="7" />
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-100">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">Outcome snapshot</p>
                  <p className="mt-1 text-lg font-semibold">A summary that still feels operationally useful.</p>
                </div>
              </div>
              <Separator className="my-5 bg-white/10" />
              <div className="space-y-3">
                {reviewHighlights.map((highlight) => (
                  <div key={highlight} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    {highlight}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <TimerReset className="h-4 w-4 text-cyan-200" />
                Review what changed during the day instead of losing the story after the last ride.
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeatureRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

