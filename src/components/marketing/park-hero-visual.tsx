import Image from "next/image";
import { CloudSun, MapPinned, Route, Save } from "lucide-react";

import { cn } from "@/lib/utils";

const callouts = [
  {
    icon: Route,
    label: "Real-time guidance",
    value: "Reroutes around changing waits and closures",
  },
  {
    icon: MapPinned,
    label: "Smarter pacing",
    value: "Balances must-dos, distance, and family energy",
  },
  {
    icon: CloudSun,
    label: "Live park context",
    value: "Weather, alerts, and queue shifts stay in view",
  },
  {
    icon: Save,
    label: "Saved progress",
    value: "Pick the planning flow back up whenever you want",
  },
];

export function ParkHeroVisual({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[34px] border border-[rgba(18,37,31,0.1)] bg-[#f7f3eb] shadow-[0_28px_64px_rgba(24,41,36,0.08)]",
        className
      )}
    >
      <div className={cn("relative aspect-[5/6] sm:aspect-[16/12]", compact ? "min-h-[420px]" : "min-h-[520px]")}>
        <Image
          src="/parqara-hero.jpeg"
          alt="Guests walking through a bright amusement park promenade"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,25,22,0.06)_0%,rgba(14,25,22,0.18)_45%,rgba(14,25,22,0.68)_100%)]" />

        <div className="absolute left-5 top-5 rounded-full border border-white/70 bg-[rgba(255,250,244,0.86)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 backdrop-blur-xl">
          Live park intelligence
        </div>

        <div className="absolute inset-x-5 bottom-5 space-y-4">
          <div className="max-w-[28rem] rounded-[28px] border border-white/50 bg-[rgba(255,250,244,0.16)] p-5 text-white backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-white/72">Planner view</p>
            <p className="mt-3 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight sm:text-3xl">
              Build the day once. Let live updates keep it credible.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {callouts.map((callout) => {
              const Icon = callout.icon;
              return (
                <div
                  key={callout.label}
                  className="rounded-[24px] border border-white/50 bg-[rgba(255,250,244,0.84)] p-4 text-slate-950 shadow-[0_14px_34px_rgba(18,37,31,0.12)] backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{callout.label}</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-950">{callout.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

