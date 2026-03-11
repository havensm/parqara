import Link from "next/link";

import { BILLING_PLANS } from "@/lib/billing";
import type { SubscriptionTierValue } from "@/lib/contracts";
import { cn } from "@/lib/utils";

import { PlanBadge } from "@/components/billing/plan-badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PricingGridProps = {
  currentTier?: SubscriptionTierValue;
  signedIn?: boolean;
  showActions?: boolean;
};

export function PricingGrid({ currentTier, signedIn = false, showActions = true }: PricingGridProps) {
  const plans = Object.values(BILLING_PLANS);

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {plans.map((plan) => {
        const isCurrentPlan = currentTier === plan.tier;
        const ctaHref = signedIn ? "/billing" : "/signup";
        const ctaLabel = isCurrentPlan ? "Current plan" : plan.tier === "FREE" ? "Start free" : `Choose ${plan.name}`;

        return (
          <Card
            key={plan.tier}
            className={cn(
              "flex h-full flex-col p-6 sm:p-7",
              plan.tier === "PLUS" ? "border-[#b8ddd5] shadow-[0_28px_80px_rgba(18,107,99,0.1)]" : undefined,
              isCurrentPlan ? "ring-2 ring-[#1b6b63]/15" : undefined
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{plan.tagline}</p>
                <h3 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold text-slate-950">{plan.name}</h3>
              </div>
              <PlanBadge tier={plan.tier} />
            </div>

            <div className="mt-6 flex items-end gap-2">
              <span className="font-[family-name:var(--font-space-grotesk)] text-5xl font-semibold tracking-tight text-slate-950">{plan.monthlyLabel}</span>
              <span className="pb-1 text-sm text-slate-500">/ month</span>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">{plan.summary}</p>
            <p className="mt-4 inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">{plan.badge}</p>

            <div className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                  {feature}
                </div>
              ))}
            </div>

            {showActions ? (
              <div className="mt-6 pt-2">
                {isCurrentPlan ? (
                  <span className={buttonStyles({ variant: "ghost", size: "default" }) + " w-full justify-center border border-slate-200 bg-slate-50 text-slate-500"}>
                    {ctaLabel}
                  </span>
                ) : (
                  <Link href={ctaHref} className={buttonStyles({ variant: plan.tier === "PLUS" ? "primary" : "secondary", size: "default" }) + " w-full"}>
                    {ctaLabel}
                  </Link>
                )}
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
