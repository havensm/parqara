"use client";

import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Footprints,
  LoaderCircle,
  MapPinned,
  Save,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import type { ParkCatalogDto, TripDetailDto } from "@/lib/contracts";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TripFormValues = {
  name: string;
  visitDate: string;
  partySize: number;
  kidsAgesInput: string;
  thrillTolerance: "LOW" | "MEDIUM" | "HIGH";
  walkingTolerance: "LOW" | "MEDIUM" | "HIGH";
  startTime: string;
  breakStart: string;
  breakEnd: string;
  mustDoRideIds: string[];
  preferredRideTypes: string[];
  diningPreferences: string[];
};

type SaveState = "idle" | "saving" | "saved" | "error";

const inputClassName =
  "mt-2 w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-0 transition focus:border-[#1b6b63]/40";

const thrillOptions = [
  {
    value: "LOW",
    label: "Low thrill",
    description: "Keep the day gentle and easy to say yes to.",
  },
  {
    value: "MEDIUM",
    label: "Balanced mix",
    description: "Blend family rides with a few stronger peaks.",
  },
  {
    value: "HIGH",
    label: "Big headliners",
    description: "Let the plan chase the strongest attractions.",
  },
] as const;

const walkingOptions = [
  {
    value: "LOW",
    label: "Compact path",
    description: "Stay tighter and avoid long crisscrosses.",
  },
  {
    value: "MEDIUM",
    label: "Balanced route",
    description: "Walk some extra distance when timing improves.",
  },
  {
    value: "HIGH",
    label: "Go anywhere",
    description: "Cover more ground if the payoff is worth it.",
  },
] as const;

function toggleSelection(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function parseKidsAges(input: string) {
  return input
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value >= 0 && value <= 17);
}

function buildDraftPayload(values: TripFormValues) {
  const hasValidBreakWindow = Boolean(values.breakStart && values.breakEnd && values.breakStart < values.breakEnd);
  const trimmedName = values.name.trim();

  return {
    name: trimmedName.length >= 3 ? trimmedName : undefined,
    visitDate: values.visitDate,
    partySize: values.partySize,
    kidsAges: parseKidsAges(values.kidsAgesInput),
    thrillTolerance: values.thrillTolerance,
    walkingTolerance: values.walkingTolerance,
    startTime: values.startTime,
    breakStart: hasValidBreakWindow ? values.breakStart : null,
    breakEnd: hasValidBreakWindow ? values.breakEnd : null,
    mustDoRideIds: values.mustDoRideIds,
    preferredRideTypes: values.preferredRideTypes,
    diningPreferences: values.diningPreferences,
  };
}

function formatSavedAt(date: Date | null) {
  if (!date) {
    return "Auto-saving your trip details";
  }

  return `Saved at ${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)}`;
}

export function TripForm({ catalog, initialTrip }: { catalog: ParkCatalogDto; initialTrip: TripDetailDto }) {
  const router = useRouter();
  const [isGenerating, startGeneration] = useTransition();

  const initialValues: TripFormValues = {
    name: initialTrip.name,
    visitDate: initialTrip.visitDate,
    partySize: initialTrip.partyProfile.partySize,
    kidsAgesInput: initialTrip.partyProfile.kidsAges.join(", "),
    thrillTolerance: initialTrip.partyProfile.thrillTolerance,
    walkingTolerance: initialTrip.partyProfile.walkingTolerance,
    startTime: initialTrip.partyProfile.startTime,
    breakStart: initialTrip.partyProfile.breakStart ?? "",
    breakEnd: initialTrip.partyProfile.breakEnd ?? "",
    mustDoRideIds: initialTrip.partyProfile.mustDoRideIds,
    preferredRideTypes: initialTrip.partyProfile.preferredRideTypes,
    diningPreferences: initialTrip.partyProfile.diningPreferences,
  };

  const [values, setValues] = useState<TripFormValues>(initialValues);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const hasHydrated = useRef(false);
  const lastSavedPayload = useRef(JSON.stringify(buildDraftPayload(initialValues)));

  const persistDraft = useCallback(async () => {
    const payload = buildDraftPayload(values);
    const snapshot = JSON.stringify(payload);

    if (snapshot === lastSavedPayload.current) {
      return true;
    }

    setSaveState("saving");
    setSaveError(null);

    const response = await fetch(`/api/trips/${initialTrip.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setSaveState("error");
      setSaveError(result.error || "Unable to save your trip details.");
      return false;
    }

    lastSavedPayload.current = snapshot;
    setSaveState("saved");
    setLastSavedAt(new Date());
    return true;
  }, [initialTrip.id, values]);

  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      void persistDraft();
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [persistDraft]);

  function updateValues(nextValues: Partial<TripFormValues>) {
    setSaveError(null);
    setSaveState("idle");
    setValues((current) => ({
      ...current,
      ...nextValues,
    }));
  }

  const selectedMustDos = catalog.mustDoOptions.filter((attraction) => values.mustDoRideIds.includes(attraction.id));
  const kidsSummary = parseKidsAges(values.kidsAgesInput);
  const summaryCards = [
    {
      label: "Planner",
      value: values.name.trim() || initialTrip.name,
      detail: catalog.park.name,
      icon: MapPinned,
    },
    {
      label: "Trip date",
      value: values.visitDate,
      detail: `${catalog.park.opensAt} to ${catalog.park.closesAt}`,
      icon: CalendarDays,
    },
    {
      label: "Group",
      value: `${values.partySize} ${values.partySize === 1 ? "guest" : "guests"}`,
      detail: kidsSummary.length ? `Kids ages ${kidsSummary.join(", ")}` : "No kids ages saved",
      icon: Users,
    },
    {
      label: "Arrival",
      value: values.startTime,
      detail: values.breakStart && values.breakEnd ? `Break ${values.breakStart} - ${values.breakEnd}` : "No break window saved",
      icon: Clock3,
    },
    {
      label: "Priorities",
      value: `${values.thrillTolerance.toLowerCase()} thrill`,
      detail: `${values.walkingTolerance.toLowerCase()} walking tolerance`,
      icon: Footprints,
    },
    {
      label: "Must-dos",
      value: `${selectedMustDos.length} saved`,
      detail: selectedMustDos.length ? selectedMustDos.slice(0, 2).map((ride) => ride.name).join(" | ") : "No must-dos locked yet",
      icon: Sparkles,
    },
  ];

  async function handleGenerate() {
    startGeneration(async () => {
      const saved = await persistDraft();
      if (!saved) {
        return;
      }

      const response = await fetch(`/api/trips/${initialTrip.id}/generate`, {
        method: "POST",
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setSaveState("error");
        setSaveError(result.error || "Unable to build the trip plan.");
        return;
      }

      router.push(`/trips/${initialTrip.id}`);
      router.refresh();
    });
  }

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Trip details</p>
          <h2 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
            At a glance
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Keep the essentials here. Use Mara above to gather missing details, then adjust the fields below whenever the trip changes.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
          <Save className="h-4 w-4 text-teal-700" />
          <span>
            {saveState === "saving"
              ? "Saving details..."
              : saveState === "error"
                ? saveError || "Unable to save your trip details."
                : formatSavedAt(lastSavedAt)}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <SnapshotCard key={card.label} label={card.label} value={card.value} detail={card.detail} icon={card.icon} />
        ))}
      </div>

      {saveError && saveState === "error" ? (
        <p className="mt-4 rounded-[22px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{saveError}</p>
      ) : null}

      <details className="group mt-6 rounded-[28px] border border-slate-200 bg-slate-50 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Advanced details</p>
            <p className="mt-2 text-sm text-slate-600">Open the full trip settings, preferences, and must-dos.</p>
          </div>
          <ChevronDown className="h-5 w-5 text-slate-500 transition group-open:rotate-180" />
        </summary>

        <div className="border-t border-slate-200 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm text-slate-600">
              Trip name
              <input
                value={values.name}
                onChange={(event) => updateValues({ name: event.currentTarget.value })}
                className={inputClassName}
                placeholder="Saturday at Aurora Adventure"
              />
            </label>

            <label className="text-sm text-slate-600">
              Visit date
              <input
                type="date"
                value={values.visitDate}
                onChange={(event) => updateValues({ visitDate: event.currentTarget.value })}
                className={inputClassName}
              />
            </label>

            <label className="text-sm text-slate-600">
              Arrival time
              <input
                type="time"
                value={values.startTime}
                onChange={(event) => updateValues({ startTime: event.currentTarget.value })}
                className={inputClassName}
              />
            </label>

            <label className="text-sm text-slate-600">
              Party size
              <input
                type="number"
                min={1}
                max={12}
                value={values.partySize}
                onChange={(event) =>
                  updateValues({
                    partySize: Math.min(12, Math.max(1, Number(event.currentTarget.value) || 1)),
                  })
                }
                className={inputClassName}
              />
            </label>

            <label className="text-sm text-slate-600">
              Kids ages
              <input
                value={values.kidsAgesInput}
                onChange={(event) => updateValues({ kidsAgesInput: event.currentTarget.value })}
                className={inputClassName}
                placeholder="6, 9"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2 xl:col-span-1">
              <label className="text-sm text-slate-600">
                Break starts
                <input
                  type="time"
                  value={values.breakStart}
                  onChange={(event) => updateValues({ breakStart: event.currentTarget.value })}
                  className={inputClassName}
                />
              </label>
              <label className="text-sm text-slate-600">
                Break ends
                <input
                  type="time"
                  value={values.breakEnd}
                  onChange={(event) => updateValues({ breakEnd: event.currentTarget.value })}
                  className={inputClassName}
                />
              </label>
            </div>
          </div>

          <section className="mt-8">
            <p className="text-sm font-semibold text-slate-950">Thrill tolerance</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {thrillOptions.map((option) => (
                <SelectableCard
                  key={option.value}
                  title={option.label}
                  description={option.description}
                  selected={values.thrillTolerance === option.value}
                  onClick={() => updateValues({ thrillTolerance: option.value })}
                />
              ))}
            </div>
          </section>

          <section className="mt-8">
            <p className="text-sm font-semibold text-slate-950">Walking tolerance</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {walkingOptions.map((option) => (
                <SelectableCard
                  key={option.value}
                  title={option.label}
                  description={option.description}
                  selected={values.walkingTolerance === option.value}
                  onClick={() => updateValues({ walkingTolerance: option.value })}
                />
              ))}
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">Must-do experiences</p>
              <Badge variant="neutral">{selectedMustDos.length} selected</Badge>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {catalog.mustDoOptions.map((attraction) => {
                const selected = values.mustDoRideIds.includes(attraction.id);
                return (
                  <button
                    key={attraction.id}
                    type="button"
                    onClick={() => updateValues({ mustDoRideIds: toggleSelection(values.mustDoRideIds, attraction.id) })}
                    className={cn(
                      "rounded-[24px] border px-4 py-4 text-left transition",
                      selected ? "border-[#b3d8d0] bg-cyan-50" : "border-slate-200 bg-white hover:border-[#bfd4cb]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{attraction.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{attraction.zone}</p>
                      </div>
                      <Badge variant={selected ? "info" : "neutral"}>{selected ? "Saved" : "Optional"}</Badge>
                    </div>
                    <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-400">
                      Thrill {attraction.thrillLevel}/5 {attraction.kidFriendly ? "| Kid-friendly" : "| Headliner"}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-8">
            <p className="text-sm font-semibold text-slate-950">Preferred ride styles</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {catalog.rideTypeOptions.map((option) => (
                <TagButton
                  key={option.value}
                  selected={values.preferredRideTypes.includes(option.value)}
                  onClick={() => updateValues({ preferredRideTypes: toggleSelection(values.preferredRideTypes, option.value) })}
                >
                  {option.label}
                </TagButton>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <p className="text-sm font-semibold text-slate-950">Dining preferences</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {catalog.diningPreferenceOptions.map((option) => (
                <TagButton
                  key={option.value}
                  selected={values.diningPreferences.includes(option.value)}
                  onClick={() => updateValues({ diningPreferences: toggleSelection(values.diningPreferences, option.value) })}
                >
                  {option.label}
                </TagButton>
              ))}
            </div>
          </section>
        </div>
      </details>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Mara uses these saved trip details when shaping the first plan.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="secondary" onClick={() => void persistDraft()} disabled={saveState === "saving" || isGenerating}>
            Save details
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={isGenerating || saveState === "saving"}>
            {isGenerating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isGenerating ? "Building plan..." : "Build plan"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SelectableCard({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[24px] border p-5 text-left transition",
        selected ? "border-[#b3d8d0] bg-cyan-50" : "border-slate-200 bg-white hover:border-[#bfd4cb]"
      )}
    >
      <p className="text-base font-semibold text-slate-950">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
    </button>
  );
}

function TagButton({
  children,
  selected,
  onClick,
}: {
  children: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-semibold transition",
        selected ? "border-[#b3d8d0] bg-cyan-50 text-teal-700" : "border-slate-200 bg-white text-slate-600 hover:border-[#bfd4cb]"
      )}
    >
      {children}
    </button>
  );
}

function SnapshotCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3 text-slate-950">
        <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-cyan-50 text-teal-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
          <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-600">{detail}</p>
    </div>
  );
}


