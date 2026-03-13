import { Check, CloudSun, MapPinned, Route, Sparkles, Users } from "lucide-react";

import { MaraPortrait } from "@/components/assistant/mara-portrait";

const planItems = ["Meet at entrance", "Lunch at 12:30", "Parade at 3 PM"];
const taskItems = ["Fast Pass for Splash Cove", "Snack break", "Fireworks tonight"];
const routeStops = [
  { id: 1, label: "Castle gate", className: "left-[58%] top-[18%] bg-[#3b82f6]" },
  { id: 2, label: "Harbor turn", className: "left-[18%] top-[43%] bg-[#2563eb]" },
  { id: 3, label: "Lake bridge", className: "left-[46%] top-[67%] bg-[#4b7a96]" },
  { id: 4, label: "Garden loop", className: "left-[73%] top-[50%] bg-[#f4b254]" },
] as const;
const quickActions = ["Find a ride", "Show schedule"];
const partyDots = ["A", "J", "M"];

export function HomepageHeroVisual() {
  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,250,252,0.92))] p-4 shadow-[0_28px_80px_rgba(15,23,42,0.1)] sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(96,165,250,0.18),transparent_24%),radial-gradient(circle_at_84%_18%,rgba(251,191,36,0.12),transparent_22%),radial-gradient(circle_at_50%_86%,rgba(20,184,166,0.12),transparent_26%),linear-gradient(180deg,rgba(240,248,255,0.62),rgba(255,248,240,0.24))]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(242,247,251,0.84))]" />
      <div className="absolute left-[-8%] top-[24%] h-48 w-48 rounded-full bg-[rgba(96,165,250,0.12)] blur-3xl" />
      <div className="absolute right-[-6%] top-[10%] h-44 w-44 rounded-full bg-[rgba(251,191,36,0.12)] blur-3xl" />
      <div className="absolute bottom-[-8%] left-[28%] h-40 w-56 rounded-full bg-[rgba(20,184,166,0.12)] blur-3xl" />

      <div className="relative grid gap-3 lg:grid-cols-[0.82fr_1.34fr_0.96fr] lg:grid-rows-[1fr_auto]">
        <div className="rounded-[26px] border border-white/80 bg-white/82 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:row-span-2">
          <p className="text-sm font-semibold text-slate-700">Group Plan</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Today&apos;s Adventure</p>
          <div className="mt-3 flex items-center gap-1.5">
            {partyDots.map((item, index) => (
              <span
                key={item}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${
                  index === 0 ? "bg-[#c26d45]" : index === 1 ? "bg-[#5973c8]" : "bg-[#355d7a]"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-4 space-y-2.5">
            {planItems.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[18px] border border-slate-100 bg-white px-3 py-2.5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f4fb] text-[#315f81]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-medium text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/90 bg-white/86 p-3 shadow-[0_24px_54px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:row-span-2">
          <div className="rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,#f6fbff_0%,#eef6ef_100%)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xl font-semibold text-[#315f81]">Parqara</p>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
              </div>
            </div>

            <div className="relative mt-4 overflow-hidden rounded-[22px] border border-[#dce8df] bg-[radial-gradient(circle_at_18%_20%,rgba(167,243,208,0.26),transparent_22%),radial-gradient(circle_at_82%_24%,rgba(191,219,254,0.32),transparent_24%),linear-gradient(180deg,#eaf3e5_0%,#dcefe4_100%)] px-4 py-5">
              <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,255,255,0.34)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:48px_48px]" />
              <div className="absolute left-[12%] top-[14%] h-10 w-12 rounded-[8px] bg-[rgba(255,255,255,0.42)] shadow-[0_8px_18px_rgba(15,23,42,0.04)]" />
              <div className="absolute right-[10%] top-[18%] h-12 w-16 rounded-[10px] bg-[rgba(255,255,255,0.4)] shadow-[0_8px_18px_rgba(15,23,42,0.04)]" />
              <div className="absolute right-[18%] bottom-[18%] h-14 w-20 rounded-[10px] bg-[rgba(255,255,255,0.36)] shadow-[0_8px_18px_rgba(15,23,42,0.04)]" />
              <div className="absolute left-[24%] bottom-[14%] h-12 w-14 rounded-full bg-[rgba(255,255,255,0.34)] shadow-[0_8px_18px_rgba(15,23,42,0.04)]" />

              <svg viewBox="0 0 440 240" className="relative z-10 h-auto w-full">
                <path
                  d="M68 136C95 115 113 66 149 62C185 58 182 101 218 104C253 107 261 76 293 78C328 81 353 117 345 143C336 171 287 166 259 178C221 194 214 214 182 206C148 197 153 161 118 154C91 149 71 154 68 136Z"
                  fill="rgba(122,175,214,0.34)"
                />
                <path
                  d="M54 138C99 108 105 74 158 69C196 66 204 92 238 94C281 96 297 71 327 80C357 88 376 125 362 152C348 179 298 176 266 191C229 209 214 225 176 216C136 206 136 166 101 158C79 153 63 157 54 138Z"
                  fill="none"
                  stroke="#2f75aa"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {routeStops.map((stop) => (
                <div key={stop.id} className={`absolute ${stop.className}`}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white text-base font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]">
                    {stop.id}
                  </div>
                </div>
              ))}

              <div className="absolute left-3 bottom-3 flex items-center gap-3 rounded-[18px] border border-white/70 bg-[#3a6682] px-3 py-2.5 text-white shadow-[0_14px_28px_rgba(15,23,42,0.14)]">
                <Route className="h-4 w-4" />
                <div>
                  <p className="text-sm font-semibold">25 min</p>
                  <p className="text-xs text-white/80">Ride open</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-white/80 bg-white/82 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-sm font-semibold text-slate-700">Task List</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">To do today</p>
          <div className="mt-4 space-y-2.5">
            {taskItems.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[18px] border border-slate-100 bg-white px-3 py-2.5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-medium text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr] lg:grid-cols-1">
          <div className="rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,rgba(71,117,146,0.92),rgba(44,80,109,0.94))] p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
            <div className="flex items-center gap-2 text-white/90">
              <CloudSun className="h-5 w-5" />
              <span className="text-lg font-semibold">82°</span>
              <span className="text-sm">Sunny</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-white/80">
              <MapPinned className="h-4 w-4" />
              <span className="text-sm">Live conditions attached to the route</span>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/85 bg-white/88 p-4 shadow-[0_22px_48px_rgba(15,23,42,0.1)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <MaraPortrait size="sm" className="h-16 w-16 rounded-[20px] shrink-0" />
              <div>
                <div className="flex items-center gap-2 text-teal-700">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-sm font-semibold">Mara</p>
                </div>
                <p className="mt-1 text-sm text-slate-500">How can I help next?</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              {quickActions.map((item) => (
                <div key={item} className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-[#d4ebe5] bg-[#eefbf7] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              <Users className="h-3.5 w-3.5" />
              One clear plan for the group
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

