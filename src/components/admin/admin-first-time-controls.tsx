"use client";

import Link from "next/link";
import { LoaderCircle, PlayCircle, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";

import { buttonStyles, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AdminFirstTimeControls({ initialIsFirstTime, previewHref }: { initialIsFirstTime: boolean; previewHref: string }) {
  const [isFirstTime, setIsFirstTime] = useState(initialIsFirstTime);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReset() {
    startTransition(async () => {
      setError(null);
      setMessage(null);

      try {
        const response = await fetch("/api/admin/first-time", {
          method: "POST",
        });
        const result = (await response.json()) as { error?: string; isFirstTime?: boolean };
        if (!response.ok) {
          throw new Error(result.error || "Unable to reset the walkthrough state.");
        }

        setIsFirstTime(Boolean(result.isFirstTime));
        setMessage("Walkthrough reset. The next real dashboard visit will show it again.");
      } catch (resetError) {
        setError(resetError instanceof Error ? resetError.message : "Unable to reset the walkthrough state.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isFirstTime ? "warning" : "neutral"}>{isFirstTime ? "Will show on next dashboard visit" : "Already dismissed"}</Badge>
        <Badge variant="info">Preview mode does not change the saved flag</Badge>
      </div>

      <p className="text-sm leading-7 text-slate-600">
        Use reset when you want to see the production first-time flow again on your own account. Use preview when you want to inspect the overlay without changing the saved user state.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={handleReset} disabled={isPending}>
          {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
          Reset isFirstTime
        </Button>
        <Link href={previewHref} className={buttonStyles({ variant: "primary", size: "default" })}>
          <PlayCircle className="mr-2 h-4 w-4" />
          Open preview walkthrough
        </Link>
      </div>

      {message ? <p className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-[20px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{error}</p> : null}
    </div>
  );
}
