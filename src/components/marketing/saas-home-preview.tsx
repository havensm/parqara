import { BellRing, Compass, Footprints, TimerReset } from "lucide-react";

import { Progress } from "@/components/ui/progress";

const route = [
  { time: "9:10", title: "Comet Run", meta: "24m wait" },
  { time: "10:05", title: "Sky Loop", meta: "Short walk" },
  { time: "12:45", title: "Harbor break", meta: "Lunch" },
];

const updates = [
  { icon: TimerReset, title: "Comet Run dropped to 24m" },
  { icon: BellRing, title: "Harbor Drop is temporarily paused" },
];

const profile = [
  { icon: Compass, label: "Must-dos saved" },
  { icon: Footprints, label: "Walking set to balanced" },
];

export function SaasHomePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[46rem]">
      <div className="absolute -left-8 top-10 h-40 w-40 rounded-full bg-teal-300/18 blur-3xl" />
      <div className="absolute -right-6 bottom-8 h-44 w-44 rounded-full bg-cyan-300/18 blur-3xl" />

      <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_36px_120px_rgba(15,23,42,0.14)]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">Parqara</p>
            <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-xl font-semibold">Live trip view</p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-100">
            Auto-synced
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 p-5 sm:p-6">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#0f766e_70%,#22d3ee_100%)] p-5 text-white">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Next move</p>
                  <h3 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight">
                    Head to Comet Run
                  </h3>
                </div>
                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white/90">
                  24m wait
                </div>
              </div>

              <p className="mt-3 max-w-md text-sm text-slate-100/85">
                Best high-priority stop right now. Keeps the rest of the route on pace.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MetricPill label="Walk" value="6m" />
                <MetricPill label="Progress" value="68%" />
                <MetricPill label="Confidence" value="91%" />
              </div>
            </div>

            <div className="space-y-3 rounded-[24px] border border-slate-200 px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-950">Adventure progress</p>
                <span className="text-sm text-slate-500">68%</span>
              </div>
              <Progress value={68} />
            </div>

            <div className="rounded-[24px] border border-slate-200 px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-950">Today&apos;s route</p>
                <span className="text-sm text-slate-500">3 key stops</span>
              </div>

              <div className="mt-4 divide-y divide-slate-200">
                {route.map((item) => (
                  <div key={item.time} className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-semibold text-slate-950">{item.time}</p>
                    <div>
                      <p className="font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/80 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 sm:px-5">
              <p className="text-sm font-semibold text-slate-950">Live signals</p>
              <div className="mt-4 space-y-4">
                {updates.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium leading-6 text-slate-600">{item.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-slate-200 bg-white px-4 py-4 sm:px-5">
              <p className="text-sm font-semibold text-slate-950">Saved setup</p>
              <div className="mt-4 space-y-3">
                {profile.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p>{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
