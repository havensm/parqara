"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Archive, Copy, FileStack, LoaderCircle, ScrollText } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  canDuplicatePlanner,
  canUseProfessionalExports,
  canUseTemplates,
  canUseVersionHistory,
} from "@/lib/billing";
import type { PlannerVersionDto, SubscriptionTierValue } from "@/lib/contracts";
import { cn } from "@/lib/utils";

import { FeatureUpsellCard } from "@/components/billing/feature-upsell-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function PlannerWorkflowPanel({
  currentTier,
  tripId,
  tripName,
  isOwner,
  compact = false,
}: {
  currentTier: SubscriptionTierValue;
  tripId: string;
  tripName: string;
  isOwner: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);
  const [versions, setVersions] = useState<PlannerVersionDto[] | null>(null);
  const [pendingAction, setPendingAction] = useState<"archive" | "duplicate" | "template" | "versions" | null>(null);
  const [isPending, startTransition] = useTransition();

  const duplicateEnabled = canDuplicatePlanner(currentTier);
  const templatesEnabled = canUseTemplates(currentTier);
  const versionHistoryEnabled = canUseVersionHistory(currentTier);
  const professionalExportsEnabled = canUseProfessionalExports(currentTier);
  const hasProWorkflowAccess = duplicateEnabled || templatesEnabled || versionHistoryEnabled || professionalExportsEnabled;

  function runAction(action: "archive" | "duplicate" | "template" | "versions", task: () => Promise<void>) {
    if (isPending) {
      return;
    }

    setError(null);
    setPendingAction(action);

    startTransition(async () => {
      try {
        await task();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to complete that planner action.");
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleDuplicate() {
    runAction("duplicate", async () => {
      const response = await fetch(`/api/trips/${tripId}/duplicate`, {
        method: "POST",
      });
      const result = (await response.json()) as { error?: string; tripId?: string };
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to duplicate this planner.");
      }

      router.push(`/trips/${result.tripId}`);
      router.refresh();
    });
  }

  function handleTemplateSave() {
    runAction("template", async () => {
      const response = await fetch(`/api/trips/${tripId}/template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: `${tripName} template` }),
      });
      const result = (await response.json()) as { error?: string; name?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to save this planner as a template.");
      }

      setTemplateMessage(result.name ? `${result.name} is ready for future planners.` : "Template saved.");
      router.refresh();
    });
  }

  function handleLoadVersions() {
    runAction("versions", async () => {
      const response = await fetch(`/api/trips/${tripId}/versions`, { cache: "no-store" });
      const result = (await response.json()) as { error?: string; versions?: PlannerVersionDto[] };
      if (!response.ok || !result.versions) {
        throw new Error(result.error || "Unable to load version history.");
      }

      setVersions(result.versions);
    });
  }

  function handleArchive() {
    runAction("archive", async () => {
      const response = await fetch(`/api/trips/${tripId}/archive`, {
        method: "POST",
      });
      const result = (await response.json()) as { error?: string; nextPath?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to archive this planner.");
      }

      router.push(result.nextPath ?? "/dashboard");
      router.refresh();
    });
  }

  return (
    <section className={cn("rounded-[30px] border border-[var(--card-border)] bg-white/82 p-5 shadow-[0_18px_38px_rgba(12,20,37,0.08)]", compact && "p-4")}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Workflow tools</p>
      <h3 className={cn("mt-2 font-semibold text-[var(--foreground)]", compact ? "text-lg" : "text-xl")}>Scale this planner</h3>
      <p className={cn("mt-2 text-sm leading-6 text-[var(--muted)]", !compact && "leading-7")}>
        {compact
          ? "Duplicate it, save repeatable templates, load saved versions, or archive it when the workspace should clear room."
          : "Duplicate it, save a reusable template, review important versions, or archive it when it should stop counting toward your active planner limit."}
      </p>

      <div className={cn("mt-5 space-y-4", !compact && "space-y-5")}>
        <div className={cn("grid gap-3", !compact && "md:grid-cols-2")}>
          <WorkflowActionCard
            title="Duplicate planner"
            detail="Create a new planner from this one without overwriting the original."
            actionLabel="Duplicate"
            pending={pendingAction === "duplicate"}
            disabled={!duplicateEnabled || isPending}
            locked={!duplicateEnabled}
            icon={<Copy className="h-4 w-4" />}
            compact={compact}
            onClick={handleDuplicate}
          />
          <WorkflowActionCard
            title="Save as template"
            detail="Keep this setup ready for future planners and repeat workflows."
            actionLabel="Save template"
            pending={pendingAction === "template"}
            disabled={!templatesEnabled || isPending}
            locked={!templatesEnabled}
            icon={<FileStack className="h-4 w-4" />}
            compact={compact}
            onClick={handleTemplateSave}
          />
          <WorkflowActionCard
            title="Version history"
            detail="Review the important snapshots already stored for this planner."
            actionLabel="Load versions"
            pending={pendingAction === "versions"}
            disabled={!versionHistoryEnabled || isPending}
            locked={!versionHistoryEnabled}
            icon={<ScrollText className="h-4 w-4" />}
            compact={compact}
            onClick={handleLoadVersions}
          />
          <WorkflowActionCard
            title="Archive planner"
            detail="Move this planner out of the active workspace without deleting it."
            actionLabel="Archive"
            pending={pendingAction === "archive"}
            disabled={!isOwner || isPending}
            locked={!isOwner}
            lockLabel="Owner only"
            icon={<Archive className="h-4 w-4" />}
            compact={compact}
            onClick={handleArchive}
          />
        </div>

        {!hasProWorkflowAccess ? (
          compact ? (
            <div className="rounded-[24px] border border-dashed border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">Pro opens repeat-workflow tools</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Duplication, templates, version history, and the higher-volume workflow tools live on Pro once you are managing planners at a higher volume.
              </p>
            </div>
          ) : (
            <FeatureUpsellCard currentTier={currentTier} feature="plannerDuplication" />
          )
        ) : null}

        <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Future export tools</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {professionalExportsEnabled
              ? "Pro keeps the entitlement reserved for a later export workspace. The shipped workflow focus today is duplication, templates, versions, and collaboration."
              : "Any future export workspace will stay on Pro once it is ready."}
          </p>
        </div>

        {templateMessage ? <p className="text-sm text-[var(--teal-700)]">{templateMessage}</p> : null}

        {pendingAction === "versions" && versions === null ? (
          <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">Saved versions</p>
            <div className="mt-3 space-y-2.5">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : null}

        {versions ? (
          <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">Saved versions</p>
            <div className="mt-3 space-y-2.5">
              {versions.length ? (
                versions.map((version) => (
                  <div key={version.id} className="rounded-[18px] border border-[var(--card-border)] bg-white px-3 py-3 text-sm text-[var(--muted)]">
                    <p className="font-semibold text-[var(--foreground)]">{version.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{version.createdAt}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">No saved versions are available yet.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-4 text-sm text-[#b14b41]">{error}</p> : null}
    </section>
  );
}

function WorkflowActionCard({
  title,
  detail,
  actionLabel,
  disabled,
  pending,
  locked = false,
  lockLabel = "Pro",
  icon,
  compact,
  onClick,
}: {
  title: string;
  detail: string;
  actionLabel: string;
  disabled: boolean;
  pending: boolean;
  locked?: boolean;
  lockLabel?: string;
  icon: ReactNode;
  compact: boolean;
  onClick: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-[var(--foreground)]">{title}</p>
        {locked ? (
          <span className="rounded-full border border-[var(--card-border)] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {lockLabel}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
      <Button type="button" variant="secondary" onClick={onClick} disabled={disabled} className={cn("mt-4", compact && "w-full justify-center")}>
        {pending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : icon}
        {actionLabel}
      </Button>
    </div>
  );
}
