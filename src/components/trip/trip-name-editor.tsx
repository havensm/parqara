"use client";

import { useRouter } from "next/navigation";
import { Check, LoaderCircle, PencilLine, X } from "lucide-react";
import { useEffect, useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

const inputClassName =
  "h-10 min-w-[220px] rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#1b6b63]/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export function TripNameEditor({ tripId, name }: { tripId: string; name: string }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isBusy = isSaving || isPending;

  useEffect(() => {
    setDraftName(name);
    setIsEditing(false);
    setError(null);
    setIsSaving(false);
  }, [tripId, name]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = draftName.trim();
    if (trimmedName === name.trim()) {
      setError(null);
      setIsEditing(false);
      return;
    }

    if (trimmedName.length < 3) {
      setError("Trip names need at least 3 characters.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
      });
      const result = (await response.json()) as { error?: string; name?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to update the trip name.");
      }

      setDraftName(result.name ?? trimmedName);
      setIsEditing(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update the trip name.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="gap-2"
        onClick={() => {
          setDraftName(name);
          setError(null);
          setIsEditing(true);
        }}
      >
        <PencilLine className="h-3.5 w-3.5" />
        Edit name
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <form className="flex flex-wrap items-center gap-2" onSubmit={handleSubmit}>
        <input
          type="text"
          aria-label="Trip name"
          value={draftName}
          onChange={(event) => {
            setDraftName(event.currentTarget.value);
            if (error) {
              setError(null);
            }
          }}
          className={inputClassName}
          maxLength={80}
          disabled={isBusy}
        />
        <Button type="submit" size="sm" className="gap-2" disabled={isBusy}>
          {isBusy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={isBusy}
          onClick={() => {
            setDraftName(name);
            setError(null);
            setIsEditing(false);
          }}
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </form>
      {error ? <p className="text-sm text-[#b14b41]">{error}</p> : null}
    </div>
  );
}
