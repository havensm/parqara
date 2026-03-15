import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarRange, Compass, HeartHandshake, Sparkles, Users2 } from "lucide-react";

import type { SubscriptionTierValue } from "@/lib/contracts";
import { generatedVisuals } from "@/lib/generated-assets";

import { PricingGrid } from "@/components/billing/pricing-grid";
import { MaraChatPreview } from "@/components/marketing/mara-chat-preview";
import { TypedHeroText } from "@/components/marketing/typed-hero-text";
import { buttonStyles } from "@/components/ui/button";
import { SectionIntro } from "@/components/ui/section-intro";

type PremiumHomepageProps = {
  currentTier?: SubscriptionTierValue;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  signedIn: boolean;
};

const featureCards = [
  {
    title: "Mara shapes the plan",
    detail: "Bring the rough idea. Mara turns it into a plan you can actually use.",
    icon: Sparkles,
    image: generatedVisuals.planners.studio,
    imageAlt: "AI-led travel planning workspace illustration",
    imageClassName: "object-cover object-center",
    tone: "bg-[rgba(238,253,249,0.9)] text-[var(--teal-700)]",
  },
  {
    title: "A live plan for the day",
    detail: "Keep the day moving with live timing and a clear next step.",
    icon: CalendarRange,
    image: generatedVisuals.homepage.dateNight,
    imageAlt: "Day-of planning and itinerary scene",
    imageClassName: "object-cover object-center",
    tone: "bg-[rgba(239,245,255,0.92)] text-[var(--sky-700)]",
  },
  {
    title: "One plan for everyone",
    detail: "Keep everyone on the same page with one shared plan and calendar.",
    icon: Users2,
    image: generatedVisuals.settings.profile,
    imageAlt: "Shared planning and calendar coordination scene",
    imageClassName: "object-cover object-center",
    tone: "bg-[rgba(246,240,255,0.92)] text-[#6d4fd6]",
  },
] as const;

const typicalUseCases = [
  {
    eyebrow: "Example",
    title: "A Friday date night",
    detail: "Dinner, sitter timing, one or two fun stops, and a backup if the night shifts.",
    icon: HeartHandshake,
    image: generatedVisuals.homepage.dateNight,
    imageAlt: "Date-night planning inspiration scene",
    imageClassName: "object-cover object-center",
    tone:
      "bg-[radial-gradient(circle_at_top_left,rgba(255,141,107,0.2),transparent_26%),linear-gradient(180deg,rgba(255,247,243,0.96),rgba(255,255,255,0.92))]",
  },
  {
    eyebrow: "Example",
    title: "A Disney week with the family",
    detail: "Park days, dining, notes, and a shared plan that still works once the trip starts.",
    icon: Compass,
    image: generatedVisuals.homepage.story,
    imageAlt: "Family trip planning inspiration scene",
    imageClassName: "object-cover object-center",
    tone:
      "bg-[radial-gradient(circle_at_top_left,rgba(99,167,255,0.2),transparent_26%),linear-gradient(180deg,rgba(241,247,255,0.96),rgba(255,255,255,0.92))]",
  },
] as const;

export function PremiumHomepage({ currentTier, primaryHref, primaryLabel, secondaryHref, secondaryLabel, signedIn }: PremiumHomepageProps) {
  return (
    <div className="relative isolate space-y-8 pb-6 sm:space-y-10 sm:pb-8">
      <section className="page-enter -mx-3 -mt-1 sm:-mx-5 lg:-mx-6 xl:-mx-8">
        <div className="relative isolate min-h-[calc(100vh-6.5rem)] overflow-hidden rounded-[28px] sm:min-h-[calc(100vh-7.5rem)] sm:rounded-[34px] lg:rounded-[40px]">
          <Image
            src={generatedVisuals.homepage.hero}
            alt="Parqara homepage hero background"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(99,167,255,0.14),transparent_24%),radial-gradient(circle_at_78%_14%,rgba(28,198,170,0.16),transparent_22%),radial-gradient(circle_at_50%_88%,rgba(255,141,107,0.16),transparent_22%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,13,24,0.24)_0%,rgba(5,13,24,0.36)_32%,rgba(5,13,24,0.5)_58%,rgba(5,13,24,0.82)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[26vh] bg-[linear-gradient(180deg,transparent_0%,rgba(5,13,24,0.2)_24%,rgba(5,13,24,0.76)_100%)]" />

          <div className="relative z-10 flex min-h-[calc(100vh-6.5rem)] items-center justify-center px-6 pb-32 pt-16 sm:min-h-[calc(100vh-7.5rem)] sm:px-10 sm:pb-36 sm:pt-20 lg:px-12 lg:pb-40">
            <TypedHeroText />
          </div>

          <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center px-6 sm:bottom-10 lg:bottom-12">
            <Link
              href={primaryHref}
              className={[
                buttonStyles({ variant: "accent", size: "xl" }),
                "min-w-[15rem] border-white/30 ring-4 ring-white/10 shadow-[0_28px_70px_rgba(244,182,73,0.34)] hover:shadow-[0_34px_82px_rgba(244,182,73,0.42)] ambient-pulse",
              ].join(" ")}
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="space-y-5 scroll-mt-32">
        <SectionIntro eyebrow="Core features" title="What Parqara makes easy." />
        <div className="grid gap-4 lg:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = card.icon;

            return (
              <div key={card.title} className="surface-shell premium-card-tilt overflow-hidden rounded-[32px]">
                <div className="relative h-52 overflow-hidden border-b border-white/70 sm:h-56">
                  <Image
                    src={card.image}
                    alt={card.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 30vw, 100vw"
                    className={card.imageClassName}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,30,0.02)_0%,rgba(8,17,30,0.46)_100%)]" />
                </div>
                <div className="p-5 sm:p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] ${card.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{card.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <MaraChatPreview />

      <section id="use-cases" className="space-y-5 scroll-mt-32">
        <SectionIntro eyebrow="Typical use cases" title="A night out or a family trip." />
        <div className="grid gap-5 xl:grid-cols-2">
          {typicalUseCases.map((useCase) => {
            const Icon = useCase.icon;

            return (
              <div
                key={useCase.title}
                className={`surface-shell premium-card-tilt overflow-hidden rounded-[34px] ${useCase.tone}`}
              >
                <div className="relative h-52 overflow-hidden border-b border-white/70 sm:h-56">
                  <Image
                    src={useCase.image}
                    alt={useCase.imageAlt}
                    fill
                    sizes="(min-width: 1280px) 42vw, 100vw"
                    className={useCase.imageClassName}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,30,0.06)_0%,rgba(8,17,30,0.54)_100%)]" />
                  <div className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/70 bg-white/82 shadow-[0_14px_30px_rgba(12,20,37,0.08)]">
                    <Icon className="h-5 w-5 text-[var(--foreground)]" />
                  </div>
                </div>
                <div className="p-6 sm:p-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">{useCase.eyebrow}</p>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                    {useCase.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{useCase.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="pricing" className="space-y-5 scroll-mt-32">
        <SectionIntro eyebrow="Pricing" title="Start free. Upgrade when you want more Mara." align="center" />
        <PricingGrid currentTier={currentTier} signedIn={signedIn} density="compact" className="mx-auto max-w-6xl" />
      </section>

      <section
        id="start"
        className="surface-dark relative overflow-hidden rounded-[40px] px-6 py-7 scroll-mt-32 sm:px-8 sm:py-8 lg:px-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(99,167,255,0.18),transparent_26%),radial-gradient(circle_at_82%_26%,rgba(28,198,170,0.18),transparent_24%),radial-gradient(circle_at_48%_100%,rgba(255,141,107,0.14),transparent_18%)]" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 lg:max-w-[48rem] lg:flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-100/72">{signedIn ? "Welcome back" : "Create your account"}</p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-[3.35rem] lg:leading-[0.96] lg:whitespace-nowrap">
              {signedIn ? "Back to planning." : "Create your account and start planning with Mara."}
            </h2>
            <p className="text-base leading-7 text-slate-300">{signedIn ? "Open Mara and shape the next adventure." : "Start planning in seconds."}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={primaryHref} className={buttonStyles({ variant: "primary", size: "lg" })}>
              {signedIn ? primaryLabel : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={secondaryHref} className={`${buttonStyles({ variant: "secondary", size: "lg" })} bg-white/12 text-white hover:bg-white/18`}>
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


