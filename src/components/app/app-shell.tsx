import type { ReactNode } from "react";

import type { SubscriptionTierValue } from "@/lib/contracts";
import type { TripWorkspaceTab } from "@/lib/trip-workspace";
import { cn } from "@/lib/utils";

import { AppFrame } from "@/components/app/app-frame";
import { TopUtilityBar } from "@/components/app/top-utility-bar";
import { PanelCard } from "@/components/ui/panel-card";

export function AppShell({
  children,
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
  secondaryActionHref,
  secondaryActionLabel,
  icon,
  visual,
  aside,
  highlights = [],
  currentTier,
  adminEnabled = false,
  plannerTabs = [],
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
  icon?: ReactNode;
  visual?: ReactNode;
  aside?: ReactNode;
  highlights?: Array<{
    icon?: ReactNode;
    label: string;
  }>;
  currentTier?: SubscriptionTierValue;
  adminEnabled?: boolean;
  plannerTabs?: Array<TripWorkspaceTab & { isActive?: boolean }>;
}) {
  return (
    <AppFrame adminEnabled={adminEnabled} currentTier={currentTier} plannerTabs={plannerTabs}>
      {/* Shared authenticated shell keeps product pages aligned around one hero, optional visual, and sticky aside pattern. */}
      <div className="space-y-6 lg:space-y-7">
        <div className={cn("grid gap-6", visual ? "2xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:items-stretch" : undefined)}>
          <TopUtilityBar
            eyebrow={eyebrow}
            title={title}
            description={description}
            icon={icon}
            highlights={highlights}
            actionHref={actionHref}
            actionLabel={actionLabel}
            secondaryActionHref={secondaryActionHref}
            secondaryActionLabel={secondaryActionLabel}
          />

          {visual ? (
            <PanelCard className="h-full p-4 sm:p-5">
              <div className="h-full rounded-[28px] border border-white/72 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(245,248,255,0.58))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-4">
                {visual}
              </div>
            </PanelCard>
          ) : null}
        </div>

        <div className={cn("grid gap-6 lg:gap-7", aside ? "2xl:grid-cols-[minmax(0,1fr)_24rem]" : undefined)}>
          <div className="min-w-0 space-y-6">{children}</div>
          {aside ? <aside className="space-y-6 2xl:sticky 2xl:top-[116px] 2xl:self-start">{aside}</aside> : null}
        </div>
      </div>
    </AppFrame>
  );
}

