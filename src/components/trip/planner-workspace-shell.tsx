"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { MessageSquareText, Sparkles } from "lucide-react";
import { motion } from "motion/react";

import type { SubscriptionTierValue } from "@/lib/contracts";
import type { TripWorkspaceTab } from "@/lib/trip-workspace";
import { cn } from "@/lib/utils";

import { AppFrame } from "@/components/app/app-frame";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { StatusChip } from "@/components/ui/status-chip";

type WorkspaceModule = {
  label: string;
  detail: string;
  href?: string;
  active?: boolean;
  tone?: "amber" | "indigo" | "sky" | "teal";
};

const toneClassNames: Record<NonNullable<WorkspaceModule["tone"]>, string> = {
  amber: "from-amber-50 to-white text-[var(--amber-700)]",
  indigo: "from-violet-50 to-white text-[#6d4fd6]",
  sky: "from-sky-50 to-white text-[var(--sky-700)]",
  teal: "from-teal-50 to-white text-[var(--teal-700)]",
};

export function PlannerWorkspaceShell({
  children,
  currentTier,
  adminEnabled = false,
  plannerTabs = [],
  workspaceHeader,
  modules = [],
  maraPanel,
  rail,
  mobileMaraLabel = "Ask Mara",
  boardMode = false,
  boardTabs,
  leadPanel,
}: {
  children?: ReactNode;
  currentTier: SubscriptionTierValue;
  adminEnabled?: boolean;
  plannerTabs?: Array<TripWorkspaceTab & { isActive?: boolean }>;
  workspaceHeader?: ReactNode;
  modules?: WorkspaceModule[];
  maraPanel?: ReactNode;
  rail?: ReactNode;
  mobileMaraLabel?: string;
  boardMode?: boolean;
  boardTabs?: ReactNode;
  leadPanel?: ReactNode;
}) {
  const [mobileMaraOpen, setMobileMaraOpen] = useState(false);
  const showsLeadPanel = Boolean(leadPanel);
  const showsMaraRail = Boolean(maraPanel) && !showsLeadPanel;
  const hasModules = modules.length > 0;
  const hasChildren = children !== undefined && children !== null && children !== false;
  const hasRail = Boolean(rail) || showsMaraRail;

  function renderModuleStrip() {
    return (
      <section
        data-testid="planner-module-strip"
        className={cn(
          boardMode
            ? "overflow-hidden rounded-[30px] border border-[var(--card-border)] bg-[linear-gradient(135deg,rgba(255,248,236,0.72),rgba(246,250,255,0.88)_52%,rgba(236,252,247,0.78))] p-4 sm:p-5"
            : "surface-shell overflow-hidden rounded-[34px] p-4 sm:p-5"
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Planner modules</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Richer modules, cleaner momentum.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              The planner stays visual and modular while Mara remains docked and ready for the next decision.
            </p>
          </div>
          <StatusChip label="Mara guided" tone="teal" />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {modules.map((module, index) => {
            const tone = toneClassNames[module.tone ?? "teal"];
            const inner = (
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "h-full rounded-[26px] border px-4 py-4 text-left",
                  module.active
                    ? `border-[rgba(28,198,170,0.2)] bg-gradient-to-br ${tone} shadow-[0_18px_32px_rgba(12,20,37,0.08)]`
                    : module.href
                      ? "border-[var(--card-border)] bg-white text-[var(--foreground)] hover:border-[rgba(99,167,255,0.22)]"
                      : "border-[var(--card-border)] bg-[rgba(248,251,255,0.92)] text-[var(--muted)]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{module.label}</p>
                  {module.active ? <StatusChip label="Now" tone="teal" /> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{module.detail}</p>
              </motion.div>
            );

            if (module.href && !module.active) {
              return (
                <Link key={`${module.label}-${index}`} href={module.href} className="block h-full">
                  {inner}
                </Link>
              );
            }

            return <div key={`${module.label}-${index}`}>{inner}</div>;
          })}
        </div>
      </section>
    );
  }

  function renderWorkspaceBody() {
    if (!hasRail) {
      return hasChildren ? <div className="min-w-0">{children}</div> : null;
    }

    return (
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_25rem] 2xl:items-start">
        <div className="min-w-0 space-y-6">{hasChildren ? children : null}</div>

        <aside
          data-testid="planner-desktop-rail"
          className={cn(
            "hidden space-y-6 2xl:block 2xl:self-start",
            boardMode ? "2xl:sticky 2xl:top-6" : "2xl:sticky 2xl:top-[116px]"
          )}
        >
          {showsMaraRail ? <div data-testid="planner-mara-dock">{maraPanel}</div> : null}
          {rail ? <div data-testid="planner-utility-rail">{rail}</div> : null}
        </aside>
      </div>
    );
  }

  function renderWorkspaceContent() {
    return (
      <>
        {leadPanel ? <div data-testid="planner-lead-panel">{leadPanel}</div> : null}
        {workspaceHeader ? workspaceHeader : null}
        {hasModules ? renderModuleStrip() : null}
        {renderWorkspaceBody()}
      </>
    );
  }

  // Board mode collapses the planner dashboard into one main workspace surface with tabs anchored at the top.
  return (
    <>
      <AppFrame adminEnabled={adminEnabled} currentTier={currentTier} plannerTabs={plannerTabs}>
        <div data-testid="planner-workspace-shell" className="space-y-6 lg:space-y-7">
          {boardMode ? (
            <section className="overflow-hidden rounded-[34px] border border-[var(--card-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,250,255,0.94))] shadow-[0_24px_60px_rgba(12,20,37,0.10)]">
              {boardTabs ? <div className="border-b border-[var(--card-border)] bg-[linear-gradient(135deg,rgba(255,247,232,0.82),rgba(246,250,255,0.92)_54%,rgba(236,252,247,0.82))] px-4 pt-4 sm:px-5 sm:pt-5 lg:px-6 lg:pt-6">{boardTabs}</div> : null}
              <div className="space-y-6 bg-transparent p-4 sm:p-5 lg:p-6">{renderWorkspaceContent()}</div>
            </section>
          ) : (
            renderWorkspaceContent()
          )}
        </div>
      </AppFrame>

      {!showsLeadPanel && maraPanel ? (
        <>
          <div className="fixed inset-x-4 bottom-24 z-40 2xl:hidden">
            <Button
              data-testid="planner-mobile-mara-trigger"
              type="button"
              onClick={() => setMobileMaraOpen(true)}
              className="w-full justify-center rounded-full px-6 py-6 shadow-[0_28px_60px_rgba(12,20,37,0.2)]"
            >
              <MessageSquareText className="mr-2 h-4 w-4" />
              {mobileMaraLabel}
              <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <BottomSheet open={mobileMaraOpen} title="Mara" onClose={() => setMobileMaraOpen(false)}>
            {maraPanel}
          </BottomSheet>
        </>
      ) : null}
    </>
  );
}
