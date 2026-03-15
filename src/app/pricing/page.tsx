import Link from "next/link";
import { CheckCircle2, Crown, Layers3, Sparkles } from "lucide-react";

import { getCurrentUserStateIfAvailable } from "@/lib/auth/guards";
import { getUserBillingState } from "@/lib/billing";
import { getBillingNotice } from "@/lib/billing-links";
import { generatedVisuals } from "@/lib/generated-assets";

import { PricingGrid } from "@/components/billing/pricing-grid";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionIntro } from "@/components/ui/section-intro";
import { VisualShowcase } from "@/components/ui/visual-showcase";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; tier?: string }>;
}) {
  const user = await getCurrentUserStateIfAvailable();
  const billing = user ? getUserBillingState(user) : null;
  const params = await searchParams;
  const notice = getBillingNotice(params.billing, params.tier);
  const primaryHref = user ? "/dashboard" : "/signup";
  const primaryLabel = user ? "Open planners" : "Create free account";
  const secondaryHref = user ? "/billing" : "/#how-it-works";
  const secondaryLabel = user ? "Open billing" : "See how it works";

  return (
    <div className="space-y-8 pb-16 sm:space-y-10 sm:pb-20">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)] xl:items-stretch">
        <div className="surface-shell overflow-hidden rounded-[40px] px-6 py-8 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <SectionIntro
            eyebrow="Pricing"
            title="Premium planning without premium confusion."
            description="Every plan includes Mara and sharing. Plus adds more room and live mode. Pro adds scale and workflow tools."
          />

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={primaryHref} className={buttonStyles({ variant: "primary", size: "lg" })}>
              {primaryLabel}
            </Link>
            <Link href={secondaryHref} className={buttonStyles({ variant: "secondary", size: "lg" })}>
              {secondaryLabel}
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Free", "Full Mara, sharing, and one active planner"],
              ["Plus", "3 active planners, live dashboard, and replans"],
              ["Pro", "Templates, versions, duplication, and scale"],
            ].map(([label, detail]) => (
              <div key={label} className="rounded-[26px] border border-white/70 bg-white/70 px-4 py-4 shadow-[0_14px_30px_rgba(12,20,37,0.08)]">
                <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
              </div>
            ))}
          </div>

          {notice ? (
            <div className="mt-6 rounded-[28px] border border-white/70 bg-white/76 px-5 py-5 shadow-[0_16px_34px_rgba(12,20,37,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Billing update</p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                {notice.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{notice.detail}</p>
            </div>
          ) : null}
        </div>

        <VisualShowcase
          src={generatedVisuals.billing.upgrade}
          alt="Premium billing and upgrade artwork"
          eyebrow="Upgrade with context"
          title="Designed to feel aspirational, not salesy."
          description="Plan upgrades are integrated into the product experience so Free, Plus, and Pro feel like a clean progression rather than disconnected billing pages."
          chips={["Free", "Plus", "Pro"]}
          priority
          className="h-full"
        />
      </section>

      <section className="space-y-5">
        <SectionIntro
          eyebrow="Compare plans"
          title="Choose the amount of planner room you need."
          description="No message packs. No confusing credits. Just a clear line between one active plan, three, or ten."
        />
        <PricingGrid currentTier={billing?.currentTier} signedIn={Boolean(user)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(239,245,255,0.92)] text-[var(--sky-700)]">
            <Layers3 className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">Free stays useful</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Full Mara stays open on Free, with one active planner for the trip or outing you are working on now.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(238,253,249,0.92)] text-[var(--teal-700)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">Plus is the main plan</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Plus is for people juggling a few plans at once and wanting live mode built in.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(255,248,235,0.96)] text-[var(--amber-700)]">
            <Crown className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">Pro unlocks workflow scale</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Templates, duplication, version history, and more active planners make Pro the repeat-workflow tier.
          </p>
        </Card>
      </section>

      <section className="surface-shell overflow-hidden rounded-[36px] px-6 py-7 sm:px-8 sm:py-8">
        <SectionIntro
          eyebrow="How access works"
          title="Plans are about room, not locked conversations."
          description="Mara is included everywhere. Upgrading is about more active planners, live mode, and scale."
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {[
            "Free includes full Mara on one active planner.",
            "Plus gives you room for three active planners plus live mode and replans.",
            "Pro adds repeat-workflow value like templates and versions instead of just charging more for the same thing.",
          ].map((item) => (
            <div key={item} className="rounded-[26px] border border-white/70 bg-white/72 px-4 py-4 text-sm leading-7 text-[var(--muted)] shadow-[0_14px_30px_rgba(12,20,37,0.08)]">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--teal-700)]" />
                <p>{item}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}



