"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Mail, Route } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function FinalizePlanDialog({
  tripId,
  tripName,
  disabled = false,
}: {
  tripId: string;
  tripName: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sendReport, setSendReport] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFinalize() {
    if (isPending || disabled) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/trips/${tripId}/finalize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sendReport }),
        });
        const result = (await response.json()) as { error?: string; redirectHref?: string };
        if (!response.ok) {
          throw new Error(result.error || "Unable to finalize this plan.");
        }

        setOpen(false);
        router.push(result.redirectHref || `/trips/${tripId}`);
        router.refresh();
      } catch (finalizeError) {
        setError(finalizeError instanceof Error ? finalizeError.message : "Unable to finalize this plan.");
      }
    });
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)} disabled={disabled}>
        <Route className="h-4 w-4" />
        Finalize plan
      </Button>

      <Dialog
        open={open}
        title="Finalize the plan"
        description="Build the first route from Mara's live snapshot once the trip details look right."
        onClose={() => {
          if (!isPending) {
            setOpen(false);
            setError(null);
          }
        }}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-5 py-5">
            <p className="text-sm leading-7 text-[var(--muted)]">
              Finalizing will use the live snapshot and logistics on <span className="font-semibold text-[var(--foreground)]">{tripName}</span> to build the first route.
            </p>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--foreground)]">
              <li>Lock the current trip snapshot as the working plan.</li>
              <li>Build the first route from the details Mara has confirmed.</li>
              <li>Open the finalized planner so you can review the route.</li>
            </ul>
          </div>

          <label className="flex items-start gap-3 rounded-[22px] border border-[var(--card-border)] bg-white px-4 py-4">
            <input
              type="checkbox"
              checked={sendReport}
              onChange={(event) => setSendReport(event.currentTarget.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--teal-700)] focus:ring-[var(--teal-700)]"
            />
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <Mail className="h-4 w-4 text-[var(--teal-700)]" />
                Send the finalized report to the trip
              </div>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Registered people will get an in-app notification, and everyone on the trip can get the finalized plan by email.
              </p>
            </div>
          </label>

          {error ? <div className="rounded-[20px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{error}</div> : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
              Not now
            </Button>
            <Button type="button" onClick={handleFinalize} disabled={isPending}>
              {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
              {isPending ? "Finalizing..." : "Finalize plan"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
