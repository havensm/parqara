import type { SubscriptionTierValue } from "@/lib/contracts";
import { getPlanByTier } from "@/lib/billing";

import { Badge } from "@/components/ui/badge";

const tierVariants: Record<SubscriptionTierValue, "neutral" | "info" | "warning"> = {
  FREE: "neutral",
  PLUS: "info",
  PRO: "warning",
};

export function PlanBadge({ tier, label, className }: { tier: SubscriptionTierValue; label?: string; className?: string }) {
  return (
    <Badge variant={tierVariants[tier]} className={className}>
      {label ?? getPlanByTier(tier).name}
    </Badge>
  );
}
