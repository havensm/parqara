import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";

import { BILLING_FEATURES, getPlanByTier, type BillingFeatureKey } from "@/lib/billing";
import type { SubscriptionTierValue } from "@/lib/contracts";
import { cn } from "@/lib/utils";

import { PlanBadge } from "@/components/billing/plan-badge";
import { buttonStyles } from "@/components/ui/button";

export function FeatureUpsellCard({
  feature,
  currentTier,
  actionHref = "/pricing",
  className,
}: {
  feature: BillingFeatureKey;
  currentTier: SubscriptionTierValue;
  actionHref?: string;
  className?: string;
}) {
  const definition = BILLING_FEATURES[feature];
  const requiredPlan = getPlanByTier(definition.requiredTier);

  return (
    <div className={cn("overflow-hidden rounded-[30px] border border-dashed border-[var(--card-border-strong)] bg-[linear-gradient(180deg,rgba(248,252,255,0.96),rgba(255,255,255,0.98))] p-5 sm:p-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--muted)] shadow-[0_10px_24px_rgba(12,20,37,0.08)]">
              <Lock className="h-4 w-4" />
            </span>
            <PlanBadge tier={definition.requiredTier} />
            {currentTier !== definition.requiredTier ? <PlanBadge tier={currentTier} label={`Current: ${getPlanByTier(currentTier).name}`} /> : null}
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">{definition.upgradeTitle}</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{definition.upgradeDescription}</p>
        </div>
        <Link href={actionHref} className={buttonStyles({ variant: "secondary", size: "default" })}>
          Upgrade to {requiredPlan.name}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {definition.highlights.map((item) => (
          <div key={item} className="rounded-[24px] border border-[var(--card-border)] bg-white px-4 py-4 text-sm leading-7 text-[var(--muted)]">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
