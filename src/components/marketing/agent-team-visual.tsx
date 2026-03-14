import {
  CalendarRange,
  Map,
  Radio,
  Route,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import { MaraPortrait } from "@/components/assistant/mara-portrait";

const specialistAgents = [
  {
    name: "Route Scout",
    detail: "Builds a cleaner ride and walking flow.",
    icon: Route,
    badgeClass: "bg-[#ecfeff] text-[#0f766e]",
  },
  {
    name: "Dining Strategist",
    detail: "Protects meal timing, breaks, and energy.",
    icon: UtensilsCrossed,
    badgeClass: "bg-[#fff7ed] text-[#c2410c]",
  },
  {
    name: "Calendar Keeper",
    detail: "Tracks dates, milestones, and trip readiness.",
    icon: CalendarRange,
    badgeClass: "bg-[#eef6ff] text-[#2563eb]",
  },
  {
    name: "Live Watch",
    detail: "Flags park changes before the day drifts.",
    icon: Radio,
    badgeClass: "bg-[#eefcf9] text-[#0f766e]",
  },
] as const;

export function AgentTeamVisual() {
  return (
    <div
      data-testid="agent-team-visual"
      className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,250,255,0.94))] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(20,184,166,0.08),transparent_22%),radial-gradient(circle_at_82%_16%,rgba(59,130,246,0.1),transparent_20%),radial-gradient(circle_at_52%_82%,rgba(14,165,233,0.06),transparent_24%)]" />

      <div className="relative space-y-4 sm:space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/92 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:text-xs">
          <Sparkles className="h-3.5 w-3.5 text-teal-700" />
          Planner agent network
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.88fr)_minmax(0,1.12fr)] lg:items-start">
          <div data-testid="agent-team-mara-card" className="rounded-[30px] border border-slate-900/10 bg-[linear-gradient(180deg,#0f172a_0%,#132238_100%)] p-5 text-white shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
            <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(103,232,249,0.7),transparent)]" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200/70">Head planner agent</p>
                <h3 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-white">Mara</h3>
              </div>
              <MaraPortrait size="sm" className="h-12 w-12 rounded-[18px] border-white/20 shadow-[0_12px_28px_rgba(8,145,178,0.16)]" />
            </div>

            <div className="mt-4 rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm leading-6 text-slate-200">
                Mara keeps the trip coherent, delegates the detail work, and brings the final plan back in one clear voice.
              </p>
            </div>

            <div className="mt-4 grid gap-2.5">
              <SignalRow label="Plan intake" value="Active" tone="bg-[#22c55e]" />
              <SignalRow label="Route pressure test" value="Running" tone="bg-[#38bdf8]" />
              <SignalRow label="Live-day watch" value="Standby" tone="bg-[#f59e0b]" />
            </div>
          </div>

          <div data-testid="agent-team-specialists" className="grid gap-3 sm:grid-cols-2">
            {specialistAgents.map((agent) => (
              <AgentCard key={agent.name} agent={agent} />
            ))}
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/92 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:text-xs">
          <Map className="h-3.5 w-3.5 text-sky-700" />
          One final plan back to the guest
        </div>
      </div>
    </div>
  );
}

function AgentCard({
  agent,
}: {
  agent: (typeof specialistAgents)[number];
}) {
  const Icon = agent.icon;

  return (
    <div className="rounded-[24px] border border-white/85 bg-white/90 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] ${agent.badgeClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Specialist agent</p>
          <h3 className="mt-1 font-[family-name:var(--font-space-grotesk)] text-lg font-semibold tracking-tight text-slate-950">{agent.name}</h3>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{agent.detail}</p>
    </div>
  );
}

function SignalRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/5 px-3 py-2.5">
      <span className="text-sm text-slate-200">{label}</span>
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
        <span className={`h-2.5 w-2.5 rounded-full ${tone}`} />
        {value}
      </span>
    </div>
  );
}
