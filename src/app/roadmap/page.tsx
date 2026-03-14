import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BellRing, CalendarRange, LayoutDashboard, Sparkles, TimerReset, Users2 } from "lucide-react";

import { MaraPortrait } from "@/components/assistant/mara-portrait";
import { FloatingIconOrnaments } from "@/components/marketing/floating-icon-ornaments";
import { buttonStyles } from "@/components/ui/button";

const roadmapMonths = [
  {
    month: "April 2026",
    phase: "Shared trips",
    title: "Trip sharing that actually works for families and groups",
    summary: "Shared trip spaces, clearer roles, and cleaner handoff so one person is not relaying every update.",
    icon: Users2,
    badgeClass: "bg-[#e9fbf6] text-[#0f766e]",
    lineClass: "bg-[#5cc9b2]",
  },
  {
    month: "May 2026",
    phase: "Timelines",
    title: "Smarter daily timelines with less manual tuning",
    summary: "Planning shifts from list-building to flow-building, with clearer pacing and less manual repair.",
    icon: TimerReset,
    badgeClass: "bg-[#eef6ff] text-[#2563eb]",
    lineClass: "bg-[#74a7f7]",
  },
  {
    month: "June 2026",
    phase: "Calendar sync",
    title: "Calendar sync that keeps the whole trip visible",
    summary: "Trips and milestones stay visible in real life, not just after you remember to open the app.",
    icon: CalendarRange,
    badgeClass: "bg-[#f4efff] text-[#7c3aed]",
    lineClass: "bg-[#a58af6]",
  },
  {
    month: "July 2026",
    phase: "Mara grows",
    title: "Mara becomes a stronger planning partner",
    summary: "The assistant gets better at spotting missing inputs, tradeoffs, and plan weakness before the day slips.",
    icon: Sparkles,
    badgeClass: "bg-[#fff5e9] text-[#c57a12]",
    lineClass: "bg-[#f0b354]",
  },
  {
    month: "August 2026",
    phase: "Live trip mode",
    title: "Live trip mode gets more useful in the park",
    summary: "Parqara starts feeling less like a document and more like the live operating layer for the day.",
    icon: BellRing,
    badgeClass: "bg-[#eefcf9] text-[#0f766e]",
    lineClass: "bg-[#51c4a3]",
  },
  {
    month: "September 2026",
    phase: "System polish",
    title: "A more polished trip system from first idea to final recap",
    summary: "The full product tightens up, with a cleaner path from trip kickoff through completion.",
    icon: LayoutDashboard,
    badgeClass: "bg-[#eff7ff] text-[#315f81]",
    lineClass: "bg-[#6ca4cf]",
  },
] as const;

const roadmapArcs = [
  {
    eyebrow: "April + May",
    title: "Shared trips and clearer trip flow",
    detail: "Make the trip easier to share, easier to understand, and easier to keep moving without manual cleanup.",
    months: [roadmapMonths[0], roadmapMonths[1]],
    visual: "brief",
  },
  {
    eyebrow: "June + July",
    title: "Calendar visibility and a sharper Mara",
    detail: "Keep upcoming trips in view and make Mara noticeably better at strengthening the plan before the day starts.",
    months: [roadmapMonths[2], roadmapMonths[3]],
    visual: "mara",
  },
  {
    eyebrow: "August + September",
    title: "A stronger live mode and a more polished system",
    detail: "Make the product more useful in the park and cleaner across the full lifecycle of a trip.",
    months: [roadmapMonths[4], roadmapMonths[5]],
    visual: "live",
  },
] as const;

const roadmapHeroOrnaments = [
  {
    icon: CalendarRange,
    positionClass: "left-[42%] top-8",
    toneClass: "bg-[#f4efff] text-[#7c3aed]",
    animationClass: "ambient-icon-orbit",
    delay: "-1.8s",
  },
  {
    icon: Sparkles,
    positionClass: "right-[10%] top-[18%]",
    toneClass: "bg-[#fff5e9] text-[#c57a12]",
    animationClass: "ambient-icon-glow",
    delay: "-3.2s",
  },
  {
    icon: BellRing,
    positionClass: "left-[56%] bottom-8",
    toneClass: "bg-[#eefcf9] text-[#0f766e]",
    animationClass: "ambient-icon-bob",
    delay: "-4.8s",
  },
] as const;

const roadmapCtaOrnaments = [
  {
    icon: LayoutDashboard,
    positionClass: "right-[26%] top-8",
    toneClass: "bg-[#123143] text-[#9fe8ef]",
    animationClass: "ambient-icon-orbit",
    delay: "-1s",
  },
  {
    icon: Users2,
    positionClass: "left-[36%] bottom-8",
    toneClass: "bg-[#123143] text-[#9fe8ef]",
    animationClass: "ambient-icon-bob",
    delay: "-4s",
  },
] as const;

export default function RoadmapPage() {
  return (
    <div className="relative isolate mx-auto max-w-6xl space-y-8 pb-16 sm:space-y-10 sm:pb-20">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-full w-screen -translate-x-1/2 overflow-hidden [mask-image:linear-gradient(90deg,transparent_0%,black_8%,black_92%,transparent_100%)]">
        <Image
          src="/marketing/parqara-ambient-background.png"
          alt=""
          fill
          priority
          className="object-cover object-top opacity-50 scale-[1.04] blur-[1px]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(34,211,238,0.08),transparent_26%),radial-gradient(circle_at_84%_18%,rgba(16,185,129,0.08),transparent_24%),linear-gradient(180deg,rgba(248,250,252,0.1),rgba(248,250,252,0.92))]" />
      </div>

      <section className="relative overflow-hidden rounded-[40px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(242,249,249,0.97))] px-6 py-8 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-8 sm:py-10 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(20,184,166,0.08),transparent_30%),radial-gradient(circle_at_88%_14%,rgba(96,165,250,0.14),transparent_26%)]" />
        <FloatingIconOrnaments items={roadmapHeroOrnaments} className="z-10" />
        <div className="relative z-10 grid gap-8 xl:grid-cols-[0.42fr_0.58fr] xl:items-start">
          <div className="space-y-5">
            <div className="inline-flex rounded-full border border-white/90 bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-900/80 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
              Roadmap
            </div>
            <div className="space-y-3">
              <h1 className="max-w-xl font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-[4rem] lg:leading-[0.98]">
                What Parqara is building through September 2026.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
                The next six months are about making the trip easier to share, easier to see, and calmer to run when the day changes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className={buttonStyles({ variant: "primary", size: "lg" })}>
                Create account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                Back to home
              </Link>
            </div>
          </div>
          <RoadmapStrip />
        </div>
      </section>

      {roadmapArcs.map((arc, index) => (
        <section
          key={arc.eyebrow}
          className="grid gap-6 rounded-[36px] border border-white/80 bg-white/78 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:p-7 lg:p-8 xl:grid-cols-[0.36fr_0.64fr] xl:items-center"
        >
          <div className={index % 2 === 1 ? "space-y-3 xl:order-2 xl:max-w-sm" : "space-y-3 xl:max-w-sm"}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{arc.eyebrow}</p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {arc.title}
            </h2>
            <p className="text-base leading-7 text-slate-600">{arc.detail}</p>
            <div className="grid gap-3 pt-2">
              {arc.months.map((month) => (
                <MonthChip key={month.month} month={month} />
              ))}
            </div>
          </div>
          <div className={index % 2 === 1 ? "xl:order-1" : ""}>
            <ArcVisual arc={arc.visual} />
          </div>
        </section>
      ))}

      <section className="relative overflow-hidden rounded-[38px] border border-slate-900/10 bg-[linear-gradient(180deg,#07111b_0%,#0f172a_100%)] px-6 py-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:px-8 sm:py-10 lg:px-10">
        <Image src="/marketing/parqara-ambient-background.png" alt="" fill className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.16),transparent_26%),radial-gradient(circle_at_86%_28%,rgba(15,118,110,0.18),transparent_24%)]" />
        <FloatingIconOrnaments items={roadmapCtaOrnaments} className="z-10" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Early users</p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Each month should make planning feel clearer, calmer, and more useful.
            </h2>
            <p className="text-base leading-7 text-slate-300">
              That means less coordination overhead, better visibility, and a trip that stays usable before, during, and after the day itself.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className={buttonStyles({ variant: "primary", size: "lg" })}>
              Create account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/" className={`${buttonStyles({ variant: "ghost", size: "lg" })} text-white hover:bg-white/10 hover:text-white`}>
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function RoadmapStrip() {
  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,250,0.92))] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(34,211,238,0.1),transparent_22%),radial-gradient(circle_at_84%_12%,rgba(96,165,250,0.12),transparent_20%)]" />
      <div className="relative space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/90 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            April to September 2026
          </div>
          <div className="hidden h-px flex-1 bg-[linear-gradient(90deg,rgba(148,163,184,0.08),rgba(49,95,129,0.2),rgba(148,163,184,0.08))] sm:block" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
          {roadmapMonths.map((entry, index) => {
            const Icon = entry.icon;

            return (
              <div key={entry.month} className="flex items-start gap-4 rounded-[22px] border border-white/80 bg-white/70 px-4 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <div className={`ambient-icon-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] ${entry.badgeClass}`} style={{ animationDelay: `${index * -0.7}s` }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{entry.month.replace(" 2026", "")}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{entry.phase}</p>
                  <div className={`mt-3 h-1.5 w-12 rounded-full ${entry.lineClass}`} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute left-[5%] right-[5%] top-[1.6rem] h-px bg-[linear-gradient(90deg,rgba(148,163,184,0.08),rgba(49,95,129,0.2),rgba(148,163,184,0.08))]" />
          <div className="grid grid-cols-6 gap-3">
            {roadmapMonths.map((entry, index) => {
              const Icon = entry.icon;

              return (
                <div key={entry.month} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 rounded-full bg-white/78 p-2.5 ring-8 ring-white/70">
                    <div className={`ambient-icon-glow flex h-12 w-12 items-center justify-center rounded-[18px] ${entry.badgeClass}`} style={{ animationDelay: `${index * -0.8}s` }}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{entry.month.replace(" 2026", "")}</p>
                  <p className="mt-2 max-w-[7.5rem] text-base font-semibold leading-6 text-slate-950">{entry.phase}</p>
                  <div className={`mt-4 h-1.5 w-12 rounded-full ${entry.lineClass}`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ArcVisual({ arc }: { arc: (typeof roadmapArcs)[number]["visual"] }) {
  if (arc === "brief") {
    return <ProductImageCard badge="Shared plan" src="/marketing/parqara-collab-brief-product.png" alt="Parqara shared trip plan" />;
  }

  if (arc === "live") {
    return <ProductImageCard badge="Live inbox" src="/marketing/parqara-live-inbox-product.png" alt="Parqara live notification inbox" />;
  }

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,248,255,0.94))] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(124,58,237,0.12),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(245,158,11,0.12),transparent_22%),radial-gradient(circle_at_54%_84%,rgba(34,211,238,0.1),transparent_24%)]" />
      <div className="relative space-y-4">
        <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white/84 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Calendar sync</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">Trips stay visible alongside real life.</p>
            </div>
            <div className="ambient-icon-bob flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#f4efff] text-[#7c3aed]">
              <CalendarRange className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {[
              "Upcoming trips and prep windows live on the calendar.",
              "Trip status is visible before, during, and after the visit.",
            ].map((item) => (
              <div key={item} className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-900/10 bg-[linear-gradient(180deg,#0f172a_0%,#132238_100%)] p-4 text-white shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">Mara grows</p>
              <p className="mt-2 text-lg font-semibold text-white">A stronger planning partner.</p>
            </div>
            <MaraPortrait size="sm" className="h-14 w-14 shrink-0 rounded-[18px] border-white/20 shadow-[0_12px_28px_rgba(8,145,178,0.16)]" />
          </div>
          <div className="mt-5 grid gap-2.5">
            {["Uses saved trip context first", "Spots missing inputs earlier", "Pressure-tests the plan before the day"].map((item) => (
              <div key={item} className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-2.5 text-sm leading-6 text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthChip({ month }: { month: (typeof roadmapMonths)[number] }) {
  const Icon = month.icon;

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/86 px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-4">
        <div className={`ambient-icon-glow flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${month.badgeClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{month.month}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">{month.phase}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{month.summary}</p>
        </div>
      </div>
    </div>
  );
}

function ProductImageCard({ alt, badge, src }: { alt: string; badge: string; src: string }) {
  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,250,0.92))] p-3 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-4">
      <div className="absolute left-5 top-5 z-10 rounded-full border border-white/90 bg-white/92 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
        {badge}
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(20,184,166,0.08),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(96,165,250,0.12),transparent_22%)]" />
      <div className="relative overflow-hidden rounded-[26px] border border-slate-200/70 bg-white">
        <Image src={src} alt={alt} width={1536} height={1024} className="h-auto w-full" sizes="(min-width: 1280px) 46vw, (min-width: 640px) 80vw, 100vw" />
      </div>
    </div>
  );
}
