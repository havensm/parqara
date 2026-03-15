import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";

import { BILLING_PLANS, hasTierAccess } from "@/lib/billing";
import { BILLING_PORTAL_HREF, getBillingCheckoutHref } from "@/lib/billing-links";
import type { SubscriptionTierValue } from "@/lib/contracts";
import { cn } from "@/lib/utils";

import { PlanBadge } from "@/components/billing/plan-badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PricingGridProps = {
  currentTier?: SubscriptionTierValue;
  signedIn?: boolean;
  showActions?: boolean;
  density?: "default" | "compact";
  className?: string;
};

const tierStyles = {
  FREE: {
    card: "border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,251,0.96))]",
    glow: "shadow-[0_24px_64px_rgba(15,23,42,0.06)]",
    topAccent: "bg-[linear-gradient(90deg,#cbd5e1_0%,#dbeafe_48%,rgba(255,255,255,0)_100%)]",
    orb: "bg-slate-300/35",
    chip: "border-slate-200 bg-white/88 text-slate-500",
    checkWrap: "bg-slate-100 text-slate-600",
    kicker: "text-slate-500",
    buttonVariant: "secondary",
  },
  PLUS: {
    card: "border-[#b8ddd5] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.16),transparent_24%),linear-gradient(180deg,rgba(245,255,252,0.98),rgba(255,255,255,0.96))]",
    glow: "shadow-[0_30px_84px_rgba(18,107,99,0.12)]",
    topAccent: "bg-[linear-gradient(90deg,#2dd4bf_0%,#7dd3fc_52%,rgba(255,255,255,0)_100%)]",
    orb: "bg-teal-300/45",
    chip: "border-teal-100 bg-white/88 text-teal-700",
    checkWrap: "bg-teal-100 text-teal-700",
    kicker: "text-teal-700/80",
    buttonVariant: "primary",
  },
  PRO: {
    card: "border-[#ead8ba] bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(217,70,239,0.14),transparent_24%),linear-gradient(180deg,rgba(255,250,241,0.98),rgba(255,255,255,0.96))]",
    glow: "shadow-[0_28px_80px_rgba(180,83,9,0.1)]",
    topAccent: "bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_42%,#c084fc_74%,rgba(255,255,255,0)_100%)]",
    orb: "bg-amber-300/45",
    chip: "border-amber-100 bg-white/88 text-amber-700",
    checkWrap: "bg-amber-100 text-amber-700",
    kicker: "text-amber-700/85",
    buttonVariant: "secondary",
  },
} as const;


function PricingActionLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (href.startsWith("/api/")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
function getPlanAction(planTier: SubscriptionTierValue, currentTier: SubscriptionTierValue | undefined, signedIn: boolean) {
  if (!signedIn || !currentTier) {
    return {
      href: "/signup",
      label: planTier === "FREE" ? "Start free" : `Choose ${BILLING_PLANS[planTier].name}`,
      isCurrentPlan: false,
    };
  }

  if (planTier === currentTier) {
    return {
      href: null,
      label: "Current plan",
      isCurrentPlan: true,
    };
  }

  if (hasTierAccess(currentTier, planTier)) {
    return {
      href: BILLING_PORTAL_HREF,
      label: "Manage downgrade",
      isCurrentPlan: false,
    };
  }

  if (planTier === "FREE") {
    return {
      href: BILLING_PORTAL_HREF,
      label: "Manage downgrade",
      isCurrentPlan: false,
    };
  }

  return {
    href: getBillingCheckoutHref(planTier),
    label: `Choose ${BILLING_PLANS[planTier].name}`,
    isCurrentPlan: false,
  };
}

export function PricingGrid({
  currentTier,
  signedIn = false,
  showActions = true,
  density = "default",
  className,
}: PricingGridProps) {
  const plans = Object.values(BILLING_PLANS);
  const isCompact = density === "compact";

  return (
    <div className={cn("grid gap-4 xl:grid-cols-3", className)}>
      {plans.map((plan) => {
        const styles = tierStyles[plan.tier];
        const action = getPlanAction(plan.tier, currentTier, signedIn);
        const visibleFeatures = isCompact ? plan.features.slice(0, 4) : plan.features;
        const hiddenFeatureCount = plan.features.length - visibleFeatures.length;

        return (
          <Card
            key={plan.tier}
            className={cn(
              "relative flex h-full flex-col overflow-hidden p-0 transition duration-200 hover:-translate-y-1",
              styles.card,
              styles.glow,
              action.isCurrentPlan ? "ring-2 ring-[#1b6b63]/18" : undefined
            )}
          >
            <div className={cn("absolute inset-x-0 top-0", isCompact ? "h-1" : "h-1.5", styles.topAccent)} />
            <div className={cn("pointer-events-none absolute -right-10 top-10 rounded-full blur-3xl", isCompact ? "h-24 w-24" : "h-28 w-28", styles.orb)} />

            <div className={cn("relative flex h-full flex-col", isCompact ? "p-4 sm:p-5" : "p-5 sm:p-6")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={cn(isCompact ? "text-[11px] tracking-[0.22em]" : "text-xs tracking-[0.24em]", "font-semibold uppercase", styles.kicker)}>
                    {plan.tagline}
                  </p>
                  <h3 className={cn(
                    "mt-3 font-[family-name:var(--font-space-grotesk)] font-semibold tracking-tight text-slate-950",
                    isCompact ? "text-[1.45rem] sm:text-[1.58rem]" : "text-[1.8rem] sm:text-[1.95rem]"
                  )}>
                    {plan.name}
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <PlanBadge tier={plan.tier} className={isCompact ? "px-2 py-0.5 text-[10px]" : undefined} />
                  {action.isCurrentPlan ? (
                    <span className={cn(
                      "rounded-full border font-semibold uppercase",
                      isCompact ? "px-2.5 py-1 text-[9px] tracking-[0.16em]" : "px-3 py-1 text-[10px] tracking-[0.18em]",
                      styles.chip
                    )}>
                      Current
                    </span>
                  ) : null}
                </div>
              </div>

              <div className={cn("flex items-end gap-2", isCompact ? "mt-4" : "mt-6")}>
                <span className={cn(
                  "font-[family-name:var(--font-space-grotesk)] font-semibold tracking-tight text-slate-950",
                  isCompact ? "text-[2.15rem] sm:text-[2.35rem]" : "text-[2.65rem] sm:text-[2.85rem]"
                )}>
                  {plan.monthlyLabel}
                </span>
                <span className={cn("pb-1 text-slate-500", isCompact ? "text-xs" : "text-sm")}>/ month</span>
              </div>

              <p className={cn("text-slate-600", isCompact ? "mt-3 text-sm leading-6" : "mt-4 text-sm leading-7")}>
                {plan.summary}
              </p>

              <div className={cn("flex flex-wrap gap-2", isCompact ? "mt-3" : "mt-4")}>
                <div className={cn(
                  "inline-flex rounded-full border font-semibold",
                  isCompact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1 text-[11px]",
                  styles.chip
                )}>
                  {plan.badge}
                </div>
                <div className={cn(
                  "inline-flex rounded-full border font-semibold",
                  isCompact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1 text-[11px]",
                  styles.chip
                )}>
                  {plan.activePlannerLimit} active planner{plan.activePlannerLimit === 1 ? "" : "s"}
                </div>
              </div>

              <div className={cn(isCompact ? "mt-4 space-y-2.5" : "mt-6 space-y-3")}>
                {visibleFeatures.map((feature) => (
                  <div key={feature} className={cn("flex items-start gap-3", isCompact ? "gap-2.5" : undefined)}>
                    <div className={cn(
                      "mt-0.5 flex shrink-0 items-center justify-center rounded-full",
                      isCompact ? "h-6 w-6" : "h-7 w-7",
                      styles.checkWrap
                    )}>
                      <Check className={cn(isCompact ? "h-3 w-3" : "h-3.5 w-3.5")} />
                    </div>
                    <p className={cn("text-slate-700", isCompact ? "text-[13px] leading-5" : "text-sm leading-6")}>
                      {feature}
                    </p>
                  </div>
                ))}
                {isCompact && hiddenFeatureCount > 0 ? (
                  <p className="pl-8 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                    + {hiddenFeatureCount} more in full pricing
                  </p>
                ) : null}
              </div>

              <div className={cn(isCompact ? "mt-4" : "mt-6", "flex-1")} />

              {showActions ? (
                <div className="pt-1">
                  {action.href ? (
                    <PricingActionLink
                      href={action.href}
                      className={buttonStyles({ variant: styles.buttonVariant, size: isCompact ? "sm" : "default" }) + " w-full gap-2"}
                    >
                      {action.label}
                      <ArrowUpRight className="h-4 w-4" />
                    </PricingActionLink>
                  ) : (
                    <span
                      className={
                        buttonStyles({ variant: "ghost", size: isCompact ? "sm" : "default" }) +
                        " w-full justify-center border border-slate-200 bg-white/72 text-slate-500"
                      }
                    >
                      {action.label}
                    </span>
                  )}
                </div>
              ) : (
                <div className="pt-1">
                  <div className={cn(
                    "inline-flex items-center gap-2 rounded-full border font-semibold",
                    isCompact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-1.5 text-xs",
                    styles.chip
                  )}>
                    <Sparkles className="h-3.5 w-3.5" />
                    {plan.tier === "FREE"
                      ? "Best for trying Parqara"
                      : plan.tier === "PLUS"
                        ? "Built for full Mara planning"
                        : "Built for repeat planners and shared trips"}
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

