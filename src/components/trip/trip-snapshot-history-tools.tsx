"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, History, LoaderCircle, RotateCcw } from "lucide-react";

import type { TripLiveSnapshotStateDto } from "@/lib/contracts";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function TripSnapshotHistoryTools({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [state, setState] = useState<TripLiveSnapshotStateDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingRevisionId, setPendingRevisionId] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/live-snapshot`, { cache: "no-store" });
      const result = (await response.json()) as { error?: string } & Partial<TripLiveSnapshotStateDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to load snapshot tools.");
      }

      setState(result as TripLiveSnapshotStateDto);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load snapshot tools.");
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  async function handleRevert(revisionId: string) {
    if (!state?.canRevert || pendingRevisionId) {
      return;
    }

    setPendingRevisionId(revisionId);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/live-snapshot/revisions/${revisionId}/revert`, {
        method: "POST",
      });
      const result = (await response.json()) as { error?: string } & Partial<TripLiveSnapshotStateDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to revert this snapshot.");
      }

      setState(result as TripLiveSnapshotStateDto);
      router.refresh();
    } catch (revertError) {
      setError(revertError instanceof Error ? revertError.message : "Unable to revert this snapshot.");
    } finally {
      setPendingRevisionId(null);
    }
  }

  if (!isLoading && !state?.canRevert) {
    return null;
  }

  return (
    <Card tone="solid" className="overflow-hidden p-0 shadow-[0_16px_36px_rgba(12,20,37,0.05)]">
      <details className="group" open={isOpen} onToggle={(event) => setIsOpen((event.currentTarget as HTMLDetailsElement).open)}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 sm:px-6 [&::-webkit-details-marker]:hidden">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Advanced tools</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Snapshot history and owner-only revert tools.</p>
          </div>
          <ChevronDown className={cn("h-5 w-5 text-[var(--muted)] transition", isOpen ? "rotate-180" : "")} />
        </summary>

        <div className="border-t border-[var(--card-border)] px-5 py-5 sm:px-6 sm:py-6">
          {isLoading ? <div className="rounded-[20px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4 text-sm text-[var(--muted)]">Loading snapshot history...</div> : null}
          {error ? <div className="rounded-[20px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{error}</div> : null}

          {!isLoading && state ? (
            state.revisions.length ? (
              <div className="space-y-2.5">
                {state.revisions.map((revision) => (
                  <div key={revision.id} className="flex flex-col gap-3 rounded-[18px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-[var(--teal-700)]" />
                        <p className="text-sm font-semibold text-[var(--foreground)]">{revision.label}</p>
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted)]">{formatTimestamp(revision.createdAt)} · {revision.createdByName}</p>
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={() => void handleRevert(revision.id)} disabled={pendingRevisionId === revision.id}>
                      {pendingRevisionId === revision.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                      Revert
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[20px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4 text-sm text-[var(--muted)]">
                No snapshot history yet. Once you approve changes, they will appear here for the planner owner.
              </div>
            )
          ) : null}
        </div>
      </details>
    </Card>
  );
}
