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
    positionClass: "left-4 top-6",
  },
  {
    name: "Calendar Keeper",
    detail: "Tracks dates, milestones, and trip readiness.",
    icon: CalendarRange,
    badgeClass: "bg-[#eef6ff] text-[#2563eb]",
    positionClass: "right-4 top-10",
  },
  {
    name: "Dining Strategist",
    detail: "Protects meal timing, breaks, and energy.",
    icon: UtensilsCrossed,
    badgeClass: "bg-[#fff7ed] text-[#c2410c]",
    positionClass: "left-8 bottom-8",
  },
  {
    name: "Live Watch",
    detail: "Flags park changes before the day drifts.",
    icon: Radio,
    badgeClass: "bg-[#eefcf9] text-[#0f766e]",
    positionClass: "right-5 bottom-6",
  },
] as const;

export function AgentTeamVisual() {
  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,250,255,0.94))] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(20,184,166,0.12),transparent_22%),radial-gradient(circle_at_82%_16%,rgba(59,130,246,0.14),transparent_20%),radial-gradient(circle_at_52%_82%,rgba(14,165,233,0.08),transparent_24%)]" />

      <div className="relative sm:hidden">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/92 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <Sparkles className="h-3.5 w-3.5 text-teal-700" />
          Planner agent network
        </div>

        <div className="mt-4">
          <MaraCoreCard />
        </div>

        <div className="mt-4 grid gap-3">
          {specialistAgents.map((agent) => (
            <AgentCard key={agent.name} agent={agent} compact />
          ))}
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/92 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <Map className="h-3.5 w-3.5 text-sky-700" />
          One final plan back to the guest
        </div>
      </div>

      <div className="relative hidden min-h-[28rem] sm:block">
        <div className="absolute left-1/2 top-1/2 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-slate-200/80" />
        <div className="absolute left-1/2 top-1/2 h-[12.5rem] w-[12.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(15,118,110,0.1)]" />
        <div className="absolute left-1/2 top-1/2 h-[1px] w-[72%] -translate-x-1/2 -translate-y-1/2 bg-[linear-gradient(90deg,rgba(148,163,184,0.15),rgba(15,23,42,0.18),rgba(148,163,184,0.15))]" />
        <div className="absolute left-1/2 top-1/2 h-[68%] w-[1px] -translate-x-1/2 -translate-y-1/2 bg-[linear-gradient(180deg,rgba(148,163,184,0.15),rgba(15,23,42,0.18),rgba(148,163,184,0.15))]" />

        {specialistAgents.map((agent) => (
          <AgentCard key={agent.name} agent={agent} />
        ))}

        <div className="absolute left-1/2 top-1/2 w-[16rem] -translate-x-1/2 -translate-y-1/2">
          <MaraCoreCard />
        </div>

        <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/90 bg-white/92 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <Sparkles className="h-3.5 w-3.5 text-teal-700" />
          Planner agent network
        </div>

        <div className="absolute left-1/2 bottom-5 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/90 bg-white/92 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <Map className="h-3.5 w-3.5 text-sky-700" />
          One final plan back to the guest
        </div>
      </div>
    </div>
  );
}

function MaraCoreCard() {
  return (
    <div className="relative rounded-[30px] border border-slate-900/10 bg-[linear-gradient(180deg,#0f172a_0%,#132238_100%)] p-5 text-white shadow-[0_26px_80px_rgba(15,23,42,0.22)]">
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
          Mara keeps the whole trip coherent, delegates the detail work, and brings the final plan back to you in one clear voice.
        </p>
      </div>

      <div className="mt-4 grid gap-2.5">
        <SignalRow label="Brief intake" value="Active" tone="bg-[#22c55e]" />
        <SignalRow label="Route pressure test" value="Running" tone="bg-[#38bdf8]" />
        <SignalRow label="Live-day watch" value="Standby" tone="bg-[#f59e0b]" />
      </div>
    </div>
  );
}

function AgentCard({
  agent,
  compact = false,
}: {
  agent: (typeof specialistAgents)[number];
  compact?: boolean;
}) {
  const Icon = agent.icon;

  return (
    <div
      className={[
        compact
          ? "rounded-[24px] border border-white/85 bg-white/90 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur-xl"
          : `absolute w-[12rem] rounded-[24px] border border-white/85 bg-white/88 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:w-[12.75rem] ${agent.positionClass}`,
      ].join(" ")}
    >
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

