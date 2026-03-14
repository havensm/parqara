"use client";

import {
  ArrowRight,
  Check,
  CloudSun,
  Compass,
  MessageSquareMore,
  Route,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";

import { MaraPortrait } from "@/components/assistant/mara-portrait";

const briefPreferences = [
  {
    label: "Thrill rides",
    value: "High",
    barWidth: "84%",
    focus: "Front-load the thrill rides before midday waits climb.",
  },
  {
    label: "Breaks + snacks",
    value: "Protected",
    barWidth: "72%",
    focus: "Hold lunch and snack windows so the pace stays comfortable.",
  },
  {
    label: "Shows",
    value: "Flexible",
    barWidth: "48%",
    focus: "Keep one show or parade slot loose for a later swap.",
  },
] as const;

const mustDoItems = ["Comet Run", "Lantern Rapids", "Parade break"] as const;

const routeMoments = [
  {
    time: "9:00",
    label: "Arrive + lockers",
    decision: "Move straight to Comet Run while entry is still light.",
  },
  {
    time: "10:15",
    label: "Comet Run",
    decision: "Keep Lantern Rapids next so the route stays tight.",
  },
  {
    time: "12:00",
    label: "Lunch window",
    decision: "Protect lunch before the afternoon run starts drifting.",
  },
  {
    time: "1:15",
    label: "Parade or backup",
    decision: "Hold the parade slot as the flexible fallback move.",
  },
] as const;

const liveInboxItems = [
  {
    title: "Splash Falls is delayed",
    detail: "Move it after lunch and keep the morning route intact.",
    toneClass: "border-rose-200/80 bg-rose-50 text-rose-700",
    statusTitle: "Route shifted without breaking the day",
    statusDetail: "The route still protects lunch and keeps the next two anchors clean.",
    routeFrom: "Comet Run",
    routeTo: "Lantern Rapids",
    maraLabel: "Mara has the next best move ready",
  },
  {
    title: "Storm window around 3 PM",
    detail: "Indoor picks are already pinned as backups.",
    toneClass: "border-amber-200/80 bg-amber-50 text-amber-700",
    statusTitle: "Weather backup is already attached",
    statusDetail: "The plan can swap to indoor stops without losing the rest of the afternoon.",
    routeFrom: "Lunch at Cove Cafe",
    routeTo: "Moonlit Manor",
    maraLabel: "Backup picks are ready for the group",
  },
  {
    title: "Mara has a cleaner next stop",
    detail: "Shift to Lantern Rapids while waits are lighter.",
    toneClass: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
    statusTitle: "The next stop is already optimized",
    statusDetail: "Mara has lined up the cleaner route while the window is still open.",
    routeFrom: "Lantern Rapids",
    routeTo: "Lunch at Cove Cafe",
    maraLabel: "A cleaner route is pinned for everyone",
  },
] as const;

export function SharedBriefVisual() {
  const [activePreference, setActivePreference] = useRotatingIndex(briefPreferences.length, 2600);
  const activePreferenceItem = briefPreferences[activePreference];
  const activeMustDo = mustDoItems[activePreference % mustDoItems.length];

  return (
    <div data-testid="shared-plan-visual" className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,rgba(249,252,252,0.96),rgba(240,248,249,0.92))] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.08),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(59,130,246,0.08),transparent_22%),radial-gradient(circle_at_54%_82%,rgba(250,204,21,0.08),transparent_24%)]" />

      <div className="relative overflow-hidden rounded-[28px] border border-white/85 bg-white/88 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                <Users className="h-3.5 w-3.5" />
                Group trip plan
              </div>
              <div className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 transition-all duration-300">
                Tuning {activePreferenceItem.label}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <h3 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
                Saturday at Aurora Adventure Park
              </h3>
              <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Four guests, one full park day, thrill-forward pacing, and a short list of rides the plan should protect.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <BriefStat label="Group" value="4 travelers" />
              <BriefStat label="Window" value="9 AM to 8 PM" />
              <BriefStat label="Budget" value="$250 to $350" />
            </div>

            <div className="mt-5 rounded-[22px] bg-slate-50 px-4 py-4 transition-all duration-300">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Shared plan</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{activePreferenceItem.focus}</p>
            </div>
          </div>

          <div className="border-t border-slate-200/70 bg-slate-50/70 p-5 lg:border-l lg:border-t-0 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Saved preferences</p>
            <div className="mt-4 space-y-3">
              {briefPreferences.map((item, index) => {
                const isActive = index === activePreference;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onMouseEnter={() => setActivePreference(index)}
                    className={`w-full rounded-[18px] px-3 py-3 text-left transition-all duration-300 ${
                      isActive ? "bg-white shadow-[0_10px_26px_rgba(15,23,42,0.07)]" : "bg-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-600">
                      <span>{item.label}</span>
                      <span className={`${isActive ? "text-teal-700" : "text-slate-400"}`}>{item.value}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200/80">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isActive ? "bg-[linear-gradient(90deg,#0f766e_0%,#67e8f9_100%)]" : "bg-slate-300"
                        }`}
                        style={{ width: item.barWidth }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Must-dos</p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {mustDoItems.map((item) => {
                  const isActive = item === activeMustDo;

                  return (
                    <span
                      key={item}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[0_8px_20px_rgba(16,185,129,0.14)]"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      <Check className={`h-3.5 w-3.5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                      {item}
                    </span>
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

export function RouteBoardVisual() {
  const [activeStep, setActiveStep] = useRotatingIndex(routeMoments.length, 2400);
  const activeRouteStep = routeMoments[activeStep];

  return (
    <div data-testid="route-board-visual" className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,rgba(249,252,252,0.96),rgba(239,247,249,0.92))] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_22%,rgba(56,189,248,0.1),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(250,204,21,0.08),transparent_22%),radial-gradient(circle_at_56%_86%,rgba(20,184,166,0.08),transparent_24%)]" />

      <div className="relative overflow-hidden rounded-[28px] border border-white/85 bg-white/88 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Route board</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">A readable day, not a list of stops</h3>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            <Compass className="h-3.5 w-3.5" />
            {activeRouteStep.time} anchor active
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-6 lg:hidden">
          <div data-testid="route-board-flow" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Today&apos;s flow</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {routeMoments.map((item, index) => {
                const isActive = index === activeStep;

                return (
                  <button
                    key={item.time}
                    type="button"
                    onMouseEnter={() => setActiveStep(index)}
                    className={`block rounded-[18px] border px-4 py-3 text-left transition-all duration-300 ${
                      isActive ? "border-teal-100 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]" : "border-slate-200/80 bg-slate-50/80"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.time}</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{item.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div data-testid="route-board-map" className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#eff9f6_0%,#e2f1fb_100%)] p-4">
            <div className="relative h-[220px] overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_16%_22%,rgba(52,211,153,0.18),transparent_22%),radial-gradient(circle_at_80%_20%,rgba(96,165,250,0.2),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.4),rgba(255,255,255,0.08))]">
              <RoutePathGraphic activeIndex={activeStep} compact />
              <div className="absolute bottom-4 left-4 right-4 rounded-[18px] bg-slate-950/80 px-4 py-3 text-white backdrop-blur-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/70">Current route</p>
                <p className="mt-1 text-sm font-medium">{activeRouteStep.label}</p>
              </div>
            </div>
          </div>

          <div data-testid="route-board-decisions" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Next decisions</p>
            {routeMoments.map((item, index) => {
              const isActive = index === activeStep;

              return (
                <button
                  key={item.label}
                  type="button"
                  onMouseEnter={() => setActiveStep(index)}
                  className={`block w-full rounded-[18px] border px-4 py-3 text-left text-sm leading-6 transition-all duration-300 ${
                    isActive
                      ? "border-cyan-100 bg-cyan-50 text-slate-700 shadow-[0_10px_24px_rgba(14,165,233,0.08)]"
                      : "border-slate-200/80 bg-white text-slate-600"
                  }`}
                >
                  {item.decision}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden gap-5 p-5 sm:p-6 lg:grid lg:grid-cols-[0.78fr_0.98fr_0.88fr] lg:items-start">
          <div data-testid="route-board-flow" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Today&apos;s flow</p>
            {routeMoments.map((item, index) => {
              const isActive = index === activeStep;

              return (
                <button
                  key={item.time}
                  type="button"
                  onMouseEnter={() => setActiveStep(index)}
                  className={`block w-full rounded-[18px] border px-4 py-3 text-left transition-all duration-300 ${
                    isActive ? "border-teal-100 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.07)]" : "border-slate-200/80 bg-slate-50/80"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.time}</p>
                  <p className={`mt-1 text-sm font-medium ${isActive ? "text-slate-950" : "text-slate-700"}`}>{item.label}</p>
                </button>
              );
            })}
          </div>

          <div data-testid="route-board-map" className="relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#eff9f6_0%,#e2f1fb_100%)] px-4 py-5 sm:px-5">
            <div className="absolute left-6 top-8 h-16 w-16 rounded-full bg-emerald-200/45 blur-2xl" />
            <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-sky-200/45 blur-2xl" />
            <div className="absolute bottom-5 left-1/2 h-16 w-24 -translate-x-1/2 rounded-full bg-amber-100/60 blur-2xl" />
            <div className="relative h-[340px] overflow-hidden rounded-[20px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06))]">
              <RoutePathGraphic activeIndex={activeStep} />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-[18px] bg-slate-950/80 px-4 py-3 text-white backdrop-blur-md">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/70">Current route</p>
                  <p className="mt-1 text-sm font-medium">{activeRouteStep.label}</p>
                </div>
                <Route className="h-5 w-5 text-cyan-200" />
              </div>
            </div>
          </div>

          <div data-testid="route-board-decisions" className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Next decisions</p>
            {routeMoments.map((item, index) => {
              const isActive = index === activeStep;

              return (
                <button
                  key={item.label}
                  type="button"
                  onMouseEnter={() => setActiveStep(index)}
                  className={`block w-full rounded-[18px] border px-4 py-3 text-left text-sm leading-6 transition-all duration-300 ${
                    isActive
                      ? "border-cyan-100 bg-cyan-50 text-slate-700 shadow-[0_10px_24px_rgba(14,165,233,0.08)]"
                      : "border-slate-200/80 bg-white text-slate-600"
                  }`}
                >
                  {item.decision}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LiveInboxVisual() {
  const [activeAlert, setActiveAlert] = useRotatingIndex(liveInboxItems.length, 2800);
  const activeAlertItem = liveInboxItems[activeAlert];

  return (
    <div data-testid="live-inbox-visual" className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,rgba(248,252,252,0.96),rgba(239,247,251,0.92))] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_84%_20%,rgba(125,211,252,0.08),transparent_24%),radial-gradient(circle_at_58%_82%,rgba(255,255,255,0.18),transparent_28%)]" />

      <div className="relative overflow-hidden rounded-[28px] border border-white/85 bg-white/88 shadow-[0_18px_48px_rgba(15,23,42,0.07)]">
        <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Live inbox</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">Changes stay attached to the trip</h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                <CloudSun className="h-3.5 w-3.5" />
                Synced live
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {liveInboxItems.map((item, index) => {
                const isActive = index === activeAlert;

                return (
                  <button
                    key={item.title}
                    type="button"
                    onMouseEnter={() => setActiveAlert(index)}
                    className={`block w-full rounded-[20px] border px-4 py-4 text-left transition-all duration-300 ${item.toneClass} ${
                      isActive ? "shadow-[0_14px_32px_rgba(15,23,42,0.08)]" : "opacity-85"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 opacity-85">{item.detail}</p>
                      </div>
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${isActive ? "bg-current" : "bg-current/40"}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200/70 bg-slate-50/70 p-5 lg:border-l lg:border-t-0 sm:p-6">
            <div className="rounded-[22px] bg-slate-950 px-4 py-4 text-white transition-all duration-300">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/70">Trip status</p>
              <p className="mt-2 text-lg font-semibold">{activeAlertItem.statusTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{activeAlertItem.statusDetail}</p>
            </div>

            <div className="mt-4 rounded-[22px] border border-slate-200/80 bg-white px-4 py-4 transition-all duration-300">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Current route</p>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                <span>{activeAlertItem.routeFrom}</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span>{activeAlertItem.routeTo}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-[22px] border border-slate-200/80 bg-white px-4 py-4 transition-all duration-300">
              <MaraPortrait size="sm" className="h-16 w-16 shrink-0 rounded-[20px]" />
              <div>
                <div className="flex items-center gap-2 text-teal-700">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-sm font-semibold">Mara</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">Watching the plan and suggesting the next clean adjustment.</p>
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-[0_8px_22px_rgba(15,23,42,0.05)] transition-all duration-300">
              <MessageSquareMore className="h-3.5 w-3.5 text-sky-700" />
              {activeAlertItem.maraLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoutePathGraphic({ activeIndex, compact = false }: { activeIndex: number; compact?: boolean }) {
  const height = compact ? 220 : 340;
  const width = compact ? 320 : 360;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full">
      <path
        d={compact ? "M36 146 C 84 88, 138 66, 186 88 S 254 154, 292 110" : "M38 214 C 92 122, 154 86, 210 104 S 290 204, 324 134"}
        fill="none"
        stroke="rgba(15,118,110,0.72)"
        strokeWidth={compact ? "10" : "12"}
        strokeLinecap="round"
      />
      <path
        d={compact ? "M36 146 C 84 88, 138 66, 186 88 S 254 154, 292 110" : "M38 214 C 92 122, 154 86, 210 104 S 290 204, 324 134"}
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="4"
        strokeDasharray="1 18"
        strokeLinecap="round"
      />

      {[
        compact ? { x: 66, y: 134, label: "1" } : { x: 72, y: 192, label: "1" },
        compact ? { x: 132, y: 98, label: "2" } : { x: 148, y: 132, label: "2" },
        compact ? { x: 200, y: 112, label: "3" } : { x: 236, y: 154, label: "3" },
        compact ? { x: 262, y: 128, label: "4" } : { x: 304, y: 184, label: "4" },
      ].map((node, index) => {
        const isActive = index === activeIndex;

        return (
          <g key={node.label}>
            <circle cx={node.x} cy={node.y} r={isActive ? "20" : "17"} fill={isActive ? "#0f766e" : "#2563eb"} className="transition-all duration-300" />
            <circle cx={node.x} cy={node.y} r={isActive ? "16" : "14"} fill={isActive ? "#14b8a6" : "#3b82f6"} className="transition-all duration-300" />
            <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="white">
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function BriefStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200/80 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function useRotatingIndex(length: number, intervalMs: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const rotateIndex = useEffectEvent(() => {
    setActiveIndex((current) => (current + 1) % length);
  });

  useEffect(() => {
    if (length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      rotateIndex();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, length]);

  return [activeIndex, setActiveIndex] as const;
}
