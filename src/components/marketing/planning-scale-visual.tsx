import { CalendarDays, Compass, MapPinned, MoonStar, Sparkles } from "lucide-react";

const scaleCards = [
  {
    title: "Date night",
    detail: "Dinner, parking, one backup stop",
    icon: MoonStar,
    accentClass: "from-rose-100 via-white to-amber-50",
    badgeClass: "bg-rose-100 text-rose-700",
    items: ["7:00 Dinner", "8:30 Walk", "9:15 Dessert"],
  },
  {
    title: "Weekend away",
    detail: "Arrivals, must-dos, shared timing",
    icon: MapPinned,
    accentClass: "from-sky-100 via-white to-cyan-50",
    badgeClass: "bg-sky-100 text-sky-700",
    items: ["Friday check-in", "Saturday plan", "Sunday brunch"],
  },
  {
    title: "Week away",
    detail: "Travel days, park days, live changes",
    icon: CalendarDays,
    accentClass: "from-emerald-100 via-white to-teal-50",
    badgeClass: "bg-emerald-100 text-emerald-700",
    items: ["Travel day", "Park sequence", "Dining + breaks"],
  },
] as const;

export function PlanningScaleVisual() {
  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,249,249,0.94))] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(251,191,36,0.14),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(34,197,94,0.12),transparent_22%),radial-gradient(circle_at_46%_84%,rgba(14,165,233,0.1),transparent_24%)]" />
      <div className="absolute right-6 top-5 flex items-center gap-2 rounded-full border border-white/90 bg-white/88 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <Compass className="h-3.5 w-3.5 text-teal-700" />
        Same planner, different scale
      </div>

      <div className="relative mt-10 grid gap-4 lg:grid-cols-3">
        {scaleCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`rounded-[28px] border border-white/90 bg-gradient-to-br ${card.accentClass} p-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur-xl ${
                index === 1 ? "lg:translate-y-8" : index === 2 ? "lg:translate-y-16" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Planning mode</p>
                  <h3 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">{card.title}</h3>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-[16px] ${card.badgeClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">{card.detail}</p>

              <div className="mt-5 space-y-2.5">
                {card.items.map((item) => (
                  <div key={item} className="rounded-[18px] border border-white/90 bg-white/82 px-3 py-2.5 text-sm font-medium text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative mt-5 inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        <Sparkles className="h-3.5 w-3.5 text-teal-700" />
        One clear plan back to the guest
      </div>
    </div>
  );
}
