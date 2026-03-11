import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

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

type Signal = {
  label: string;
  value: string;
};

type FeaturePanel = {
  eyebrow: string;
  title: string;
  detail: string;
  imageSrc: string;
  imageAlt: string;
  cardClassName: string;
};

type UpgradeTool = {
  title: string;
  detail: string;
  tier: "Plus" | "Pro";
};

const heroSignals: Signal[] = [
  {
    label: "Plan",
    value: "Save the group, the must-dos, and the route in one place.",
  },
  {
    label: "Adjust",
    value: "React to wait changes without rebuilding the whole day.",
  },
  {
    label: "Upgrade",
    value: "Keep advanced tools visible, then unlock them when needed.",
  },
];

const featurePanels: FeaturePanel[] = [
  {
    eyebrow: "Trip workspace",
    title: "See the whole day on one board",
    detail: "Trip details, must-dos, routing logic, and status live together instead of getting scattered across tabs and notes.",
    imageSrc: "/illustrations/park-planning-studio.svg",
    imageAlt: "Parqara trip workspace illustration showing a park-day planning dashboard with route and trip context",
    cardClassName: "lg:col-span-2",
  },
  {
    eyebrow: "Group planning",
    title: "Build around the actual group",
    detail: "Capture ages, pacing, dining needs, break windows, and attraction preferences before the itinerary gets shaped.",
    imageSrc: "/illustrations/group-planning-system.svg",
    imageAlt: "Parqara planning system illustration showing saved group preferences, must-dos, and planning inputs",
    cardClassName: "",
  },
  {
    eyebrow: "Live routing",
    title: "Watch the next move update visually",
    detail: "Parqara can surface the best next stop with wait, walk, and timing context already attached.",
    imageSrc: "/illustrations/live-routing-preview.svg",
    imageAlt: "Parqara live routing illustration showing route cards, recommendation panels, and live park guidance",
    cardClassName: "",
  },
  {
    eyebrow: "Mara starter",
    title: "Start planning with the assistant",
    detail: "Free users can sample Mara, then Pro unlocks the full ongoing concierge for deeper trip refinement.",
    imageSrc: "/illustrations/mara-starter-preview.svg",
    imageAlt: "Parqara Mara starter illustration showing planning prompts, assistant replies, and a starter AI workflow",
    cardClassName: "",
  },
  {
    eyebrow: "Trip review",
    title: "End with a readable summary",
    detail: "The product can show what changed during the day, what time was protected, and how the plan performed after the trip.",
    imageSrc: "/illustrations/trip-summary-preview.svg",
    imageAlt: "Parqara trip summary illustration showing outcome cards, performance metrics, and recap panels",
    cardClassName: "lg:col-span-2",
  },
];

const upgradeTools: UpgradeTool[] = [
  {
    title: "Live queue reroutes",
    detail: "Surface the next best move when waits or conditions change inside the park.",
    tier: "Plus",
  },
  {
    title: "Full Mara concierge",
    detail: "Move from a short starter preview into ongoing contextual planning and follow-up refinement.",
    tier: "Pro",
  },
  {
    title: "Collaborators and advanced replans",
    detail: "Let the trip become operational when more than one person needs to manage it.",
    tier: "Pro",
  },
];

const tierTeasers = [
  {
    tier: "Free",
    title: "Start with the workspace",
    detail: "Save the trip and get a short Mara starter preview.",
    className: "border-slate-200 bg-white text-slate-700",
  },
  {
    tier: "Plus",
    title: "Unlock live execution",
    detail: "Add in-park guidance when route changes start to matter.",
    className: "border-[#b8ddd5] bg-[#eef8f5] text-teal-900",
  },
  {
    tier: "Pro",
    title: "Turn on the advanced layer",
    detail: "Get the full Mara concierge, deeper replans, and collaboration.",
    className: "border-slate-900/12 bg-slate-950 text-slate-100",
  },
];

export function PremiumHomepage({ currentTier, primaryHref, primaryLabel, secondaryHref, secondaryLabel, signedIn }: PremiumHomepageProps) {
  return (
    <div className="space-y-10 pb-16 sm:space-y-14 sm:pb-20">
      <section className="relative isolate overflow-hidden rounded-[44px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,252,247,0.98)_0%,rgba(245,249,252,0.96)_52%,rgba(239,246,251,0.98)_100%)] px-6 py-8 shadow-[0_36px_110px_rgba(15,23,42,0.08)] sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="homepage-drift absolute -left-12 top-10 h-44 w-44 rounded-full bg-emerald-300/14 blur-3xl" />
        <div className="homepage-drift absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-300/14 blur-3xl" style={{ animationDelay: "-6s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.36)_0%,rgba(255,255,255,0)_36%),radial-gradient(circle_at_12%_18%,rgba(22,163,74,0.08),transparent_22%),radial-gradient(circle_at_82%_22%,rgba(14,165,233,0.12),transparent_24%)]" />

        <div className="relative z-10 grid gap-10 xl:grid-cols-[0.84fr_1.16fr] xl:items-center">
          <div className="space-y-8">
            <div className="homepage-enter inline-flex rounded-full border border-[#d8eadf] bg-white/86 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-900/80">
              Theme park trip planner
            </div>

            <div className="homepage-enter space-y-5" style={{ animationDelay: "120ms" }}>
              <h1 className="max-w-3xl font-[family-name:var(--font-space-grotesk)] text-5xl font-semibold tracking-[-0.065em] text-slate-950 sm:text-6xl lg:text-7xl">
                See the product before you ever read the fine print.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                Parqara helps you plan a theme-park day, shape the route, and react to live changes from one visual workspace.
              </p>
            </div>

            <div className="homepage-enter flex flex-wrap gap-3" style={{ animationDelay: "220ms" }}>
              <Link href={primaryHref} className={buttonStyles({ variant: "primary", size: "lg" })}>
                {primaryLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href={secondaryHref} className={buttonStyles({ variant: "secondary", size: "lg" })}>
                {secondaryLabel}
              </Link>
            </div>

            <div className="homepage-enter grid gap-3 sm:grid-cols-3" style={{ animationDelay: "300ms" }}>
              {heroSignals.map((item) => (
                <div key={item.label} className="rounded-[24px] border border-white/90 bg-white/84 p-4 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="homepage-enter relative" style={{ animationDelay: "220ms" }}>
            <div className="homepage-float pointer-events-none absolute -right-2 top-8 z-20 hidden max-w-[16rem] rounded-[26px] border border-white/90 bg-white/92 p-4 shadow-[0_26px_60px_rgba(15,23,42,0.12)] lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Live pulse</p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">Comet Run dropped to 24 minutes. Shift it forward before lunch traffic builds.</p>
            </div>
            <div className="homepage-float pointer-events-none absolute -left-2 bottom-8 z-20 hidden max-w-[16rem] rounded-[26px] border border-slate-900/12 bg-slate-950 px-4 py-4 text-slate-100 shadow-[0_26px_60px_rgba(15,23,42,0.18)] lg:block" style={{ animationDelay: "-4s" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">Visible upgrades</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Keep the advanced tools in view and unlock them only when the trip needs them.</p>
            </div>

            <div className="overflow-hidden rounded-[40px] border border-white/90 bg-white/88 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.1)] sm:p-5">
              <div className="overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,#f7fbff_0%,#edf5fb_100%)] p-3 sm:p-4">
                <Image
                  src="/illustrations/park-planning-studio.svg"
                  alt="Parqara workspace illustration showing planning, saved trip context, and route management in one interface"
                  width={1600}
                  height={1100}
                  priority
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="scroll-mt-32 space-y-6">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Feature tour</p>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            The homepage should show the product, not just describe it.
          </h2>
          <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            These panels show the main surfaces: the trip workspace, group setup, live routing, Mara, and the trip summary.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {featurePanels.map((item) => (
            <div key={item.title} className={`rounded-[34px] border border-white/80 bg-white/84 p-4 shadow-[0_18px_46px_rgba(15,23,42,0.05)] ${item.cardClassName}`}>
              <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fa_100%)] p-3 sm:p-4">
                <Image src={item.imageSrc} alt={item.imageAlt} width={1600} height={1100} className="h-auto w-full" />
              </div>
              <div className="px-2 pb-2 pt-5 sm:px-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.eyebrow}</p>
                <h3 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-32 grid gap-6 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
        <div className="rounded-[36px] border border-slate-900/10 bg-[linear-gradient(180deg,#07111b_0%,#0f172a_100%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">How it flows</p>
          <h2 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            One trip record from the first draft to the last ride.
          </h2>
          <div className="mt-6 space-y-3 text-sm leading-7 text-slate-300">
            <p>Start by building the trip around the people who are actually going.</p>
            <p>Shape the itinerary visually, then use Mara and live routing when the day gets more dynamic.</p>
            <p>When the trip is over, the summary still tells the story of what changed and what the plan protected.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              eyebrow: "Step 1",
              title: "Capture the group",
              imageSrc: "/illustrations/group-planning-system.svg",
              imageAlt: "Group planning illustration showing party setup and saved trip defaults",
            },
            {
              eyebrow: "Step 2",
              title: "Route the day",
              imageSrc: "/illustrations/live-routing-preview.svg",
              imageAlt: "Live routing illustration showing route cards and next-step guidance",
            },
            {
              eyebrow: "Step 3",
              title: "Refine with Mara",
              imageSrc: "/illustrations/mara-starter-preview.svg",
              imageAlt: "Mara starter illustration showing assistant prompts and planning responses",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[32px] border border-white/80 bg-white/84 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <div className="overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fa_100%)] p-3">
                <Image src={item.imageSrc} alt={item.imageAlt} width={1600} height={1100} className="h-auto w-full" />
              </div>
              <div className="px-2 pb-2 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.eyebrow}</p>
                <h3 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="scroll-mt-32 space-y-6">
        <div className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Pricing</p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Start with the workspace. Upgrade when the day needs more horsepower.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Free is for planning and a short Mara starter preview. Plus is for live park guidance. Pro is for the full AI concierge and the heavier-duty tooling that shows up in the product with clear upgrade labels.
            </p>
          </div>

          <div className="overflow-hidden rounded-[34px] border border-white/80 bg-white/84 p-4 shadow-[0_18px_46px_rgba(15,23,42,0.05)]">
            <div className="overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fa_100%)] p-3 sm:p-4">
              <Image
                src="/illustrations/subscription-ladder.svg"
                alt="Subscription ladder illustration showing the Free, Plus, and Pro tiers of Parqara"
                width={1400}
                height={920}
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {upgradeTools.map((item) => (
            <UpgradeToolCard key={item.title} item={item} />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {tierTeasers.map((item) => (
            <div key={item.title} className={`rounded-[28px] border p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] ${item.className}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-75">{item.tier}</p>
              <h3 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 opacity-90">{item.detail}</p>
            </div>
          ))}
        </div>

        <PricingGrid currentTier={currentTier} signedIn={signedIn} />
      </section>

      <section
        id="start"
        className="scroll-mt-32 relative overflow-hidden rounded-[40px] border border-slate-900/10 bg-[linear-gradient(180deg,#07111b_0%,#0f172a_100%)] px-6 py-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:px-8 sm:py-10 lg:px-10 lg:py-12"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.16),transparent_26%),radial-gradient(circle_at_86%_28%,rgba(15,118,110,0.18),transparent_24%)]" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Get started</p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Keep the trip readable from the first draft to the last ride.
            </h2>
            <p className="max-w-xl text-base leading-7 text-slate-300">
              {signedIn
                ? "Open the dashboard and start building the next park day with the trip workspace, pricing tiers, and live tools already in place."
                : "Create an account, shape the outing, and keep the advanced tools visible until you are ready to unlock them."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={primaryHref} className={buttonStyles({ variant: "primary", size: "lg" })}>
              {primaryLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href={secondaryHref} className={`${buttonStyles({ variant: "ghost", size: "lg" })} text-white hover:bg-white/10 hover:text-white`}>
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function UpgradeToolCard({ item }: { item: UpgradeTool }) {
  return (
    <div className="rounded-[30px] border border-white/80 bg-white/84 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-teal-700">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          {item.tier}
        </div>
      </div>
      <h3 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700/80">Upgrade to {item.tier} to unlock</p>
    </div>
  );
}
