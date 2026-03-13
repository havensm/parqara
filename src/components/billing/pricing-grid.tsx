import Link from "next/link";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";

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

const tierStyles = {
  FREE: {
    card: "border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,251,0.96))]",
    glow: "shadow-[0_24px_64px_rgba(15,23,42,0.06)]",
    topAccent: "bg-[linear-gradient(90deg,#cbd5e1_0%,#dbeafe_48%,rgba(255,255,255,0)_100%)]",
    orb: "bg-slate-300/35",
    summaryPanel: "border-slate-200/90 bg-white/86",
    featureRow: "border-slate-200/80 bg-white/78",
    checkWrap: "bg-slate-100 text-slate-600",
    badge: "border-slate-200 bg-white/86 text-slate-500",
    kicker: "text-slate-500",
    buttonVariant: "secondary",
  },
  PLUS: {
    card: "border-[#b8ddd5] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.16),transparent_24%),linear-gradient(180deg,rgba(245,255,252,0.98),rgba(255,255,255,0.96))]",
    glow: "shadow-[0_30px_84px_rgba(18,107,99,0.12)]",
    topAccent: "bg-[linear-gradient(90deg,#2dd4bf_0%,#7dd3fc_52%,rgba(255,255,255,0)_100%)]",
    orb: "bg-teal-300/45",
    summaryPanel: "border-teal-100 bg-white/88",
    featureRow: "border-teal-100/90 bg-white/82",
    checkWrap: "bg-teal-100 text-teal-700",
    badge: "border-teal-100 bg-white/88 text-teal-700",
    kicker: "text-teal-700/80",
    buttonVariant: "primary",
  },
  PRO: {
    card: "border-[#ead8ba] bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(217,70,239,0.14),transparent_24%),linear-gradient(180deg,rgba(255,250,241,0.98),rgba(255,255,255,0.96))]",
    glow: "shadow-[0_28px_80px_rgba(180,83,9,0.1)]",
    topAccent: "bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_42%,#c084fc_74%,rgba(255,255,255,0)_100%)]",
    orb: "bg-amber-300/45",
    summaryPanel: "border-amber-100 bg-white/88",
    featureRow: "border-amber-100/90 bg-white/82",
    checkWrap: "bg-amber-100 text-amber-700",
    badge: "border-amber-100 bg-white/88 text-amber-700",
    kicker: "text-amber-700/85",
    buttonVariant: "secondary",
  },
} as const;

export function PricingGrid({ currentTier, signedIn = false, showActions = true }: PricingGridProps) {
  const plans = Object.values(BILLING_PLANS);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {plans.map((plan) => {
        const isCurrentPlan = currentTier === plan.tier;
        const ctaHref = signedIn ? "/profile#billing" : "/signup";
        const ctaLabel = isCurrentPlan ? "Current plan" : plan.tier === "FREE" ? "Start free" : `Choose ${plan.name}`;
        const styles = tierStyles[plan.tier];

        return (
          <Card
            key={plan.tier}
            className={cn(
              "relative flex h-full flex-col overflow-hidden p-0",
              styles.card,
              styles.glow,
              isCurrentPlan ? "ring-2 ring-[#1b6b63]/18" : undefined
            )}
          >
            <div className={cn("absolute inset-x-0 top-0 h-1.5", styles.topAccent)} />
            <div className={cn("pointer-events-none absolute -right-10 top-10 h-28 w-28 rounded-full blur-3xl", styles.orb)} />

            <div className="relative flex h-full flex-col p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={cn("text-xs font-semibold uppercase tracking-[0.24em]", styles.kicker)}>{plan.tagline}</p>
                  <h3 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-[1.8rem] font-semibold tracking-tight text-slate-950 sm:text-[1.95rem]">
                    {plan.name}
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <PlanBadge tier={plan.tier} />
                  {isCurrentPlan ? (
                    <span className={cn("rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]", styles.badge)}>
                      Current
                    </span>
                  ) : null}
                </div>
              </div>

              <div className={cn("mt-5 rounded-[22px] border px-4 py-4", styles.summaryPanel)}>
                <div className="flex items-end gap-2">
                  <span className="font-[family-name:var(--font-space-grotesk)] text-[2.65rem] font-semibold tracking-tight text-slate-950 sm:text-[2.85rem]">{plan.monthlyLabel}</span>
                  <span className="pb-1 text-sm text-slate-500">/ month</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{plan.summary}</p>
                <div className={cn("mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold", styles.badge)}>{plan.badge}</div>
              </div>

              <div className="mt-5 space-y-2.5">
                {plan.features.map((feature) => (
                  <div key={feature} className={cn("flex items-start gap-2.5 rounded-[18px] border px-3.5 py-3", styles.featureRow)}>
                    <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", styles.checkWrap)}>
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-sm leading-6 text-slate-700">{feature}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex-1" />

              {showActions ? (
                <div className="pt-1">
                  {isCurrentPlan ? (
                    <span
                      className={
                        buttonStyles({ variant: "ghost", size: "default" }) +
                        " w-full justify-center border border-slate-200 bg-white/72 text-slate-500"
                      }
                    >
                      {ctaLabel}
                    </span>
                  ) : (
                    <Link
                      href={ctaHref}
                      className={
                        buttonStyles({ variant: styles.buttonVariant, size: "default" }) +
                        " w-full gap-2"
                      }
                    >
                      {ctaLabel}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="pt-1">
                  <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold", styles.badge)}>
                    <Sparkles className="h-3.5 w-3.5" />
                    {plan.tier === "FREE" ? "Best for trying Parqara" : plan.tier === "PLUS" ? "Built for the live park day" : "Built for repeat planners and groups"}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}


