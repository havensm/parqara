import Image from "next/image";
import { MessageSquareText } from "lucide-react";

import type { PlannerLimitStateDto, SubscriptionTierValue } from "@/lib/contracts";
import { generatedVisuals } from "@/lib/generated-assets";

import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";

export function PlannerEmptyState({
  currentTier,
  adminEnabled = false,
  plannerLimitState,
  createHref,
}: {
  currentTier: SubscriptionTierValue;
  adminEnabled?: boolean;
  plannerLimitState: PlannerLimitStateDto;
  createHref: string;
}) {
  const plannerLabel = plannerLimitState.plannerLimit === 1 ? "planner" : "planners";
  const actionHref = plannerLimitState.canCreate ? createHref : currentTier === "FREE" ? "/pricing" : "/billing";
  const actionLabel = plannerLimitState.canCreate ? "Create planner" : currentTier === "FREE" ? "View plans" : "Open billing";

  return (
    <AppShell
      eyebrow="Planner workspace"
      title="Create your first planner."
      description="Start with one planner and shape the details manually, then upgrade when you want Mara."
      actionHref={actionHref}
      actionLabel={actionLabel}
      icon={<MessageSquareText className="h-5 w-5" />}
      currentTier={currentTier}
      adminEnabled={adminEnabled}
      highlights={[{ label: `${plannerLimitState.plannerLimit} active ${plannerLabel} on ${plannerLimitState.currentTier}` }]}
    >
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="px-6 py-6 sm:px-7 sm:py-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Get started</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
              No planners yet.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Create one planner for the trip, night out, or weekend you want to shape next. Free keeps the manual planner open, and Plus unlocks Mara when you want help shaping it.
            </p>
            <div className="mt-5 rounded-[22px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
              {plannerLimitState.canCreate
                ? `Your ${plannerLimitState.currentTier.toLowerCase()} plan has room for ${plannerLimitState.plannerLimit} active ${plannerLabel}.`
                : "Archive a planner or upgrade to make room for another one."}
            </div>
          </div>

          <div className="relative min-h-[17rem] border-t border-[var(--card-border)] lg:min-h-full lg:border-l lg:border-t-0">
            <Image
              src={generatedVisuals.planners.starter}
              alt="Starter planner illustration"
              fill
              sizes="(min-width: 1024px) 22rem, 100vw"
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,30,0.04)_0%,rgba(8,17,30,0.28)_100%)]" />
          </div>
        </div>
      </Card>
    </AppShell>
  );
}

