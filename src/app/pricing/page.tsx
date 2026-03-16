import Link from "next/link";

import { getCurrentUserStateIfAvailable } from "@/lib/auth/guards";
import { getUserBillingState } from "@/lib/billing";
import { getBillingNotice } from "@/lib/billing-links";

import { PricingGrid } from "@/components/billing/pricing-grid";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  const primaryLabel = user ? "Open Mara" : "Create free account";
  const secondaryHref = user ? "/billing" : "/login";
  const secondaryLabel = user ? "Manage billing" : "Log in";

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16 sm:space-y-8 sm:pb-20">
      <section className="surface-shell rounded-[36px] px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex rounded-full border border-white/90 bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-900/80 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
            Pricing
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-[4rem] lg:leading-[0.98]">
            Simple plans.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Mara and sharing are included everywhere. Choose based on how many active planners you need and whether you want live mode.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={primaryHref} className={buttonStyles({ variant: "primary", size: "lg" })}>
            {primaryLabel}
          </Link>
          <Link href={secondaryHref} className={buttonStyles({ variant: "secondary", size: "lg" })}>
            {secondaryLabel}
          </Link>
        </div>
      </section>

      {notice ? (
        <Card className="px-6 py-5 sm:px-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Billing update</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{notice.title}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{notice.detail}</p>
        </Card>
      ) : null}

      <section className="space-y-4">
        <div className="max-w-2xl">
          <p className="text-sm text-slate-500">Free gives you one active planner. Plus gives you three and live mode. Pro gives you ten plus repeat-workflow tools.</p>
        </div>
        <PricingGrid currentTier={billing?.currentTier} signedIn={Boolean(user)} />
      </section>

      <section>
        <div className="rounded-[28px] border border-slate-200 bg-white/84 px-5 py-4 text-sm leading-7 text-slate-600 shadow-[0_12px_32px_rgba(15,23,42,0.04)] sm:px-6">
          All plans include Mara and planner sharing. Upgrade only when you need more room or more workflow power.
        </div>
      </section>
    </div>
  );
}
