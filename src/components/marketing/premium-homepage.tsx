import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BellRing, MapPinned, MessageSquareMore, NotebookPen, Route, Users } from "lucide-react";

import type { SubscriptionTierValue } from "@/lib/contracts";

import { PricingGrid } from "@/components/billing/pricing-grid";
import { buttonStyles } from "@/components/ui/button";

type PremiumHomepageProps = {
  currentTier?: SubscriptionTierValue;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  signedIn: boolean;
};

const heroChips = ["Shared plan", "Route planning", "Live updates"];

const painPoints = [
  "Notes and screenshots get scattered before the day starts.",
  "The group loses track of what matters once the park changes.",
  "Shared planners break down when weather, waits, or closures hit.",
];

const workflowCards = [
  {
    eyebrow: "Start with the ask",
    title: "Tell Mara what kind of day you want.",
    icon: MessageSquareMore,
    tone: "from-[#eff9f6] to-white",
    visual: "brief" as const,
  },
  {
    eyebrow: "Shape the route",
    title: "Turn the ideas into one planner.",
    icon: Route,
    tone: "from-[#eef6ff] to-white",
    visual: "route" as const,
  },
  {
    eyebrow: "Run it live",
    title: "Keep up when the day changes.",
    icon: BellRing,
    tone: "from-[#eefcf9] to-white",
    visual: "live" as const,
  },
];

export function PremiumHomepage({ currentTier, primaryHref, primaryLabel, secondaryHref, secondaryLabel, signedIn }: PremiumHomepageProps) {
  return (
    <div className="relative isolate space-y-8 overflow-hidden pb-16 sm:space-y-10 sm:pb-20">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent_0%,black_10%,black_90%,transparent_100%)]">
        <Image
          src="/marketing/parqara-ambient-background.png"
          alt=""
          fill
          priority
          className="object-cover object-top opacity-52 scale-[1.04] blur-[1px]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(56,189,248,0.08),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(15,118,110,0.08),transparent_24%),radial-gradient(circle_at_50%_32%,rgba(255,255,255,0.16),transparent_40%),linear-gradient(180deg,rgba(248,250,252,0.14)_0%,rgba(248,250,252,0.54)_52%,rgba(248,250,252,0.94)_100%)]" />
      </div>

      <section className="relative overflow-hidden rounded-[38px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(248,251,252,0.95)_100%)] px-6 py-7 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-8 sm:py-8 lg:px-10 lg:py-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(20,184,166,0.08),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(96,165,250,0.12),transparent_24%)]" />
        <div className="relative z-10 grid gap-8 xl:grid-cols-[0.44fr_0.56fr] xl:items-center">
          <div className="homepage-enter space-y-6">
            <div className="inline-flex rounded-full border border-white/90 bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-900/80 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
              Adventure planner
            </div>

            <div className="space-y-4">
              <h1 className="max-w-2xl font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-[4.15rem] lg:leading-[0.96]">
                Plan the adventure in one place.
              </h1>
              <p className="max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                Parqara replaces scattered notes, group texts, and changing park conditions with one planner your whole group can actually follow.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={primaryHref} className={buttonStyles({ variant: "primary", size: "lg" })}>
                {primaryLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href={secondaryHref} className={buttonStyles({ variant: "secondary", size: "lg" })}>
                {secondaryLabel}
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {heroChips.map((chip) => (
                <div
                  key={chip}
                  className="rounded-full border border-white/90 bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-[0_12px_28px_rgba(15,23,42,0.04)]"
                >
                  {chip}
                </div>
              ))}
            </div>
          </div>

          <div className="homepage-enter relative" style={{ animationDelay: "120ms" }}>
            <div className="homepage-float absolute -left-3 top-10 hidden rounded-full border border-white/85 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-[0_18px_40px_rgba(15,23,42,0.08)] xl:block">
              Planner plan
            </div>
            <div className="homepage-float absolute bottom-8 left-10 hidden rounded-full border border-white/85 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-[0_18px_40px_rgba(15,23,42,0.08)] xl:block" style={{ animationDelay: "800ms" }}>
              Live coordination
            </div>
            <div className="homepage-float absolute right-8 top-10 hidden rounded-full border border-white/85 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-[0_18px_40px_rgba(15,23,42,0.08)] xl:block" style={{ animationDelay: "1400ms" }}>
              Route board
            </div>

            <div className="overflow-hidden rounded-[34px] border border-white/90 bg-white/90 p-3 shadow-[0_28px_80px_rgba(15,23,42,0.1)] sm:p-4">
              <div className="overflow-hidden rounded-[28px] border border-white/70 bg-[#f8fbfd]">
                <Image
                  src="/marketing/parqara-hero-editorial.png"
                  alt="Parqara park-day planning workspace"
                  width={1536}
                  height={1024}
                  priority
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="scroll-mt-28 grid gap-4 lg:grid-cols-[0.54fr_0.46fr]">
        <div className="rounded-[32px] border border-white/80 bg-white/78 px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">What problem it solves</p>
          <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Park days are hard to run when the plan lives in six different places.
          </h2>
        </div>

        <div className="grid gap-3">
          {painPoints.map((item, index) => (
            <div
              key={item}
              className="homepage-enter rounded-[28px] border border-white/80 bg-white/72 px-5 py-4 text-sm leading-7 text-slate-600 shadow-[0_16px_40px_rgba(15,23,42,0.04)] backdrop-blur-xl"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                0{index + 1}
              </span>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-28 space-y-5">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">How it works</p>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Start with the ask, keep the day readable, adjust live.
          </h2>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          {workflowCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="homepage-enter flex h-full flex-col overflow-hidden rounded-[32px] border border-white/80 bg-white/76 shadow-[0_18px_46px_rgba(15,23,42,0.05)] backdrop-blur-xl"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className={`flex min-h-[255px] flex-col bg-gradient-to-b ${card.tone} p-4`}>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-950 text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1"><SimpleWorkflowVisual kind={card.visual} /></div>
                </div>
                <div className="flex min-h-[128px] flex-col justify-start px-5 pb-5 pt-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{card.eyebrow}</p>
                  <h3 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
                    {card.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="pricing" className="scroll-mt-28 space-y-5">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Pricing</p>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Start with the planner. Upgrade when you want more live help.
          </h2>
        </div>

        <PricingGrid currentTier={currentTier} signedIn={signedIn} />
      </section>

      <section
        id="start"
        className="relative overflow-hidden rounded-[38px] border border-slate-900/10 bg-[linear-gradient(180deg,#07111b_0%,#0f172a_100%)] px-6 py-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:px-8 sm:py-10 lg:px-10"
      >
        <Image src="/marketing/parqara-ambient-background.png" alt="" fill className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.16),transparent_26%),radial-gradient(circle_at_86%_28%,rgba(15,118,110,0.18),transparent_24%)]" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Get started</p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              One planner from the first idea to the live day.
            </h2>
            <p className="max-w-xl text-base leading-7 text-slate-300">
              {signedIn
                ? "Open the dashboard and start the next planner with Mara, the route, and live coordination already connected."
                : "Create an account and start planning with the group plan, the route board, and the live inbox in one place."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={primaryHref} className={buttonStyles({ variant: "primary", size: "lg" })}>
              {primaryLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={secondaryHref}
              className={`${buttonStyles({ variant: "ghost", size: "lg" })} text-white hover:bg-white/10 hover:text-white`}
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SimpleWorkflowVisual({ kind }: { kind: "brief" | "route" | "live" }) {
  if (kind === "brief") {
    return (
      <div className="flex h-full flex-col rounded-[26px] border border-white/90 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3 rounded-[18px] bg-[#f4faf8] px-4 py-3 text-sm font-medium text-slate-600">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#dff4ee] text-teal-700">
            <Users className="h-5 w-5" />
          </div>
          Family trip, must-do coasters, midday break, stroller-friendly route.
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <MiniPill label="Aurora Adventure Park" />
          <MiniPill label="March 18" />
          <MiniPill label="4 guests" />
          <MiniPill label="Mara kickoff" />
        </div>
      </div>
    );
  }

  if (kind === "route") {
    return (
      <div className="flex h-full flex-col justify-center rounded-[26px] border border-white/90 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <div className="space-y-3 rounded-[18px] bg-[#f5f8ff] p-4">
          {["Rope drop: Comet Run", "11:10 lunch + recharge", "1:45 indoor show backup"].map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">{index + 1}</div>
              <div className="h-3 flex-1 rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]">
                <div className={`h-full rounded-full ${index === 0 ? "w-[82%] bg-[#60a5fa]" : index === 1 ? "w-[64%] bg-[#22c55e]" : "w-[72%] bg-[#818cf8]"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[26px] border border-white/90 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="grid gap-3">
        <NotificationRow tone="bg-[#fff3da] text-[#9b6018]" title="Weather update" detail="Move indoor block forward" />
        <NotificationRow tone="bg-[#ffe8e5] text-[#b14b41]" title="Ride closure" detail="Rocket Reef paused" />
        <NotificationRow tone="bg-[#e8f5ef] text-[#2f6c50]" title="Planner update" detail="Alex added lunch stop" />
      </div>
    </div>
  );
}

function MiniPill({ label }: { label: string }) {
  return <div className="rounded-full border border-white bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>;
}

function NotificationRow({ tone, title, detail }: { tone: string; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-slate-100 bg-white px-3 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${tone}`}>
        {title === "Weather update" ? <MapPinned className="h-4 w-4" /> : title === "Ride closure" ? <NotebookPen className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        <p className="text-sm text-slate-500">{detail}</p>
      </div>
    </div>
  );
}






