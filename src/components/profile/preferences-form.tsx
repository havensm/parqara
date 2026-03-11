"use client";

import { CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { useState, useTransition } from "react";

import {
  accessibilityNeedOptions,
  budgetPreferenceOptions,
  childrenAgeOptions,
  dietaryPreferenceOptions,
  groupSizeOptions,
  planningHelpLevelOptions,
  planningPriorityOptions,
  planningStyleOptions,
  travelDistanceOptions,
  type OnboardingValues,
} from "@/lib/onboarding";

import { ChoiceChip, SelectionTile } from "@/components/onboarding/selection-tile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const inputClassName =
  "mt-3 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3.5 text-slate-950 outline-none ring-0 transition focus:border-[#1b6b63]/40";
const textareaClassName =
  "mt-3 min-h-32 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3.5 text-slate-950 outline-none ring-0 transition focus:border-[#1b6b63]/40";

function toggleMultiValue(currentValues: string[], value: string) {
  if (value === "None") {
    return currentValues.includes("None") ? [] : ["None"];
  }

  const withoutNone = currentValues.filter((item) => item !== "None");
  return withoutNone.includes(value) ? withoutNone.filter((item) => item !== value) : [...withoutNone, value];
}

function togglePriority(currentValues: string[], value: string) {
  if (currentValues.includes(value)) {
    return currentValues.filter((item) => item !== value);
  }

  if (currentValues.length >= 3) {
    return currentValues;
  }

  return [...currentValues, value];
}

export function ProfilePreferencesForm({ initialValues }: { initialValues: OnboardingValues }) {
  const [values, setValues] = useState(initialValues);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateValues(nextValues: Partial<OnboardingValues>) {
    setMessage(null);
    setError(null);
    setValues((current) => ({ ...current, ...nextValues }));
  }

  function saveProfile() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error || "Unable to save your preferences.");
        return;
      }

      setMessage("Preferences saved.");
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-7">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm text-slate-600">
            First name
            <input value={values.firstName} onChange={(event) => updateValues({ firstName: event.currentTarget.value })} className={inputClassName} />
          </label>
          <label className="text-sm text-slate-600">
            Last name
            <input value={values.lastName} onChange={(event) => updateValues({ lastName: event.currentTarget.value })} className={inputClassName} />
          </label>
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <SectionHeader title="Group defaults" description="The people, pace, and budget Parqara should usually plan around." />
        <div className="mt-5 grid gap-6 xl:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-slate-950">Typical group size</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {groupSizeOptions.map((option) => (
                <SelectionTile key={option} selected={values.typicalGroupSize === option} onClick={() => updateValues({ typicalGroupSize: option })}>
                  {option}
                </SelectionTile>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Children in the mix</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {childrenAgeOptions.map((option) => (
                <SelectionTile key={option} selected={values.childrenAgeProfile === option} onClick={() => updateValues({ childrenAgeProfile: option })}>
                  {option}
                </SelectionTile>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Budget preference</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {budgetPreferenceOptions.map((option) => (
                <SelectionTile key={option} selected={values.budgetPreference === option} onClick={() => updateValues({ budgetPreference: option })}>
                  {option}
                </SelectionTile>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Travel distance</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {travelDistanceOptions.map((option) => (
                <SelectionTile key={option} selected={values.travelDistancePreference === option} onClick={() => updateValues({ travelDistancePreference: option })}>
                  {option}
                </SelectionTile>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <SectionHeader title="Food and access" description="Default considerations that should follow every plan." />
        <div className="mt-5 grid gap-6 xl:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-slate-950">Dietary preferences</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {dietaryPreferenceOptions.map((option) => (
                <ChoiceChip key={option} selected={values.dietaryPreferences.includes(option)} onClick={() => updateValues({ dietaryPreferences: toggleMultiValue(values.dietaryPreferences, option) })}>
                  {option}
                </ChoiceChip>
              ))}
            </div>
            <label className="mt-4 block text-sm text-slate-600">
              Notes
              <textarea value={values.dietaryNotes} onChange={(event) => updateValues({ dietaryNotes: event.currentTarget.value })} className={textareaClassName} />
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-950">Accessibility needs</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {accessibilityNeedOptions.map((option) => (
                <ChoiceChip key={option} selected={values.accessibilityNeeds.includes(option)} onClick={() => updateValues({ accessibilityNeeds: toggleMultiValue(values.accessibilityNeeds, option) })}>
                  {option}
                </ChoiceChip>
              ))}
            </div>
            <label className="mt-4 block text-sm text-slate-600">
              Notes
              <textarea value={values.accessibilityNotes} onChange={(event) => updateValues({ accessibilityNotes: event.currentTarget.value })} className={textareaClassName} />
            </label>
          </div>
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <SectionHeader title="Planning style" description="Tell Parqara what a good plan should optimize for." />
        <div className="mt-5 space-y-6">
          <div>
            <p className="text-sm font-semibold text-slate-950">Top priorities</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {planningPriorityOptions.map((option) => {
                const selected = values.planningPriorities.includes(option);
                const disabled = !selected && values.planningPriorities.length >= 3;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={disabled}
                    onClick={() => updateValues({ planningPriorities: togglePriority(values.planningPriorities, option) })}
                    className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                      selected
                        ? "border-[#b9ddd6] bg-[#edf8f4] text-[#18544d]"
                        : disabled
                          ? "border-slate-200 bg-slate-50 text-slate-300"
                          : "border-slate-200 bg-white text-slate-600 hover:border-[#c9d8d1]"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-950">Plan feel</p>
              <div className="mt-3 grid gap-3">
                {planningStyleOptions.map((option) => (
                  <SelectionTile key={option} selected={values.planningStyle === option} onClick={() => updateValues({ planningStyle: option })}>
                    {option}
                  </SelectionTile>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Help level</p>
              <div className="mt-3 grid gap-3">
                {planningHelpLevelOptions.map((option) => (
                  <SelectionTile key={option} selected={values.planningHelpLevel === option} onClick={() => updateValues({ planningHelpLevel: option })}>
                    {option}
                  </SelectionTile>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <SectionHeader title="Anything else?" description="Optional notes that do not fit anywhere else." />
        <label className="mt-5 block text-sm text-slate-600">
          Extra notes
          <textarea value={values.additionalNotes} onChange={(event) => updateValues({ additionalNotes: event.currentTarget.value })} className={textareaClassName} />
        </label>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {message ? <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#18544d]"><CheckCircle2 className="h-4 w-4" /> {message}</p> : null}
          {error ? <p className="text-sm font-semibold text-[#b14b41]">{error}</p> : null}
        </div>
        <Button type="button" size="lg" disabled={isPending} onClick={saveProfile}>
          {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save preferences
        </Button>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">{description}</p>
    </div>
  );
}


