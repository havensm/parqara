"use client";

import { ArrowLeft, ArrowRight, Check, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  accessibilityNeedOptions,
  adventureTypeOptions,
  budgetPreferenceOptions,
  buildPreferenceSummary,
  childrenAgeOptions,
  clampOnboardingStep,
  dietaryPreferenceOptions,
  emptyOnboardingValues,
  getOnboardingProgress,
  groupSizeOptions,
  onboardingQuestions,
  planningHelpLevelOptions,
  planningPriorityOptions,
  planningStyleOptions,
  travelDistanceOptions,
  type OnboardingValues,
} from "@/lib/onboarding";

import { ChoiceChip, SelectionTile } from "@/components/onboarding/selection-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type SaveState = "idle" | "saving" | "saved" | "error";

type OnboardingFlowProps = {
  email: string;
  initialStep: number;
  initialValues: OnboardingValues;
};

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

function toggleLimitedValue(currentValues: string[], value: string, limit: number) {
  if (currentValues.includes(value)) {
    return currentValues.filter((item) => item !== value);
  }

  if (currentValues.length >= limit) {
    return currentValues;
  }

  return [...currentValues, value];
}

function validateStep(step: number, values: OnboardingValues) {
  switch (step) {
    case 0:
      return values.firstName.trim() ? null : "Add your first name to continue.";
    case 1:
      return values.preferredAdventureTypes.length > 0 ? null : "Choose at least one adventure type.";
    case 2:
      return values.typicalGroupSize ? null : "Choose the group size you usually plan for.";
    case 3:
      return values.childrenAgeProfile ? null : "Choose the child age profile that fits most often.";
    case 4:
      return values.dietaryPreferences.length > 0 ? null : "Choose at least one dietary preference or select None.";
    case 5:
      return values.accessibilityNeeds.length > 0 ? null : "Choose at least one accessibility option or select None.";
    case 6:
      return values.planningPriorities.length > 0 ? null : "Choose at least one planning priority.";
    case 7:
      return values.planningStyle ? null : "Choose a planning style.";
    case 8:
      return values.budgetPreference ? null : "Choose a budget preference.";
    case 9:
      return values.travelDistancePreference ? null : "Choose a travel distance preference.";
    case 10:
      return values.planningHelpLevel ? null : "Choose the level of help you want from Parqara.";
    default:
      return null;
  }
}

function formatSavedAt(date: Date | null) {
  if (!date) {
    return "Progress saves automatically";
  }

  return `Saved at ${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)}`;
}

export function OnboardingFlow({ email, initialStep, initialValues }: OnboardingFlowProps) {
  const router = useRouter();
  const normalizedInitialValues = { ...emptyOnboardingValues, ...initialValues };
  const normalizedInitialStep = clampOnboardingStep(initialStep);
  const initialSnapshot = JSON.stringify({
    ...normalizedInitialValues,
    complete: false,
    currentStep: normalizedInitialStep,
  });
  const [values, setValues] = useState<OnboardingValues>(normalizedInitialValues);
  const [currentStep, setCurrentStep] = useState(normalizedInitialStep);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();
  const hasHydrated = useRef(false);
  const lastSavedPayload = useRef(initialSnapshot);

  const progress = getOnboardingProgress(currentStep);
  const question = onboardingQuestions[currentStep];
  const summaryItems = useMemo(() => buildPreferenceSummary(values), [values]);

  const persistProgress = useCallback(async (nextStep = currentStep, complete = false) => {
    const payload = {
      ...values,
      complete,
      currentStep: clampOnboardingStep(nextStep),
    };
    const snapshot = JSON.stringify(payload);

    if (snapshot === lastSavedPayload.current) {
      return true;
    }

    setSaveState("saving");
    setSaveError(null);

    const response = await fetch("/api/onboarding", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as { error?: string; currentStep?: number };
    if (!response.ok) {
      setSaveState("error");
      setSaveError(result.error || "Unable to save your onboarding progress.");
      return false;
    }

    lastSavedPayload.current = snapshot;
    setSaveState("saved");
    setLastSavedAt(new Date());
    return true;
  }, [currentStep, values]);

  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      void persistProgress();
    }, 550);

    return () => window.clearTimeout(timeout);
  }, [persistProgress]);

  function updateValues(nextValues: Partial<OnboardingValues>) {
    setStepError(null);
    setSaveError(null);
    setSaveState("idle");
    setValues((current) => ({
      ...current,
      ...nextValues,
    }));
  }

  async function handleContinue() {
    const error = validateStep(currentStep, values);
    if (error) {
      setStepError(error);
      return;
    }

    if (currentStep === onboardingQuestions.length - 1) {
      startTransition(async () => {
        const saved = await persistProgress(currentStep, true);
        if (!saved) {
          return;
        }

        router.push("/dashboard");
        router.refresh();
      });
      return;
    }

    const nextStep = clampOnboardingStep(currentStep + 1);
    setCurrentStep(nextStep);
    await persistProgress(nextStep);
  }

  async function handleBack() {
    const nextStep = clampOnboardingStep(currentStep - 1);
    setStepError(null);
    setCurrentStep(nextStep);
    await persistProgress(nextStep);
  }

  function renderCurrentStep() {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid gap-5 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              First name
              <input
                value={values.firstName}
                onChange={(event) => updateValues({ firstName: event.currentTarget.value })}
                className={inputClassName}
                placeholder="Jordan"
              />
            </label>
            <label className="text-sm text-slate-600">
              Last name
              <input
                value={values.lastName}
                onChange={(event) => updateValues({ lastName: event.currentTarget.value })}
                className={inputClassName}
                placeholder="Rivera"
              />
              <span className="mt-2 block text-xs text-slate-400">Optional.</span>
            </label>
          </div>
        );
      case 1:
        return (
          <div className="grid gap-3 md:grid-cols-2">
            {adventureTypeOptions.map((option) => (
              <SelectionTile
                key={option}
                selected={values.preferredAdventureTypes.includes(option)}
                onClick={() => updateValues({ preferredAdventureTypes: toggleMultiValue(values.preferredAdventureTypes, option) })}
              >
                {option}
              </SelectionTile>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="grid gap-3 md:grid-cols-2">
            {groupSizeOptions.map((option) => (
              <SelectionTile
                key={option}
                selected={values.typicalGroupSize === option}
                onClick={() => updateValues({ typicalGroupSize: option })}
              >
                {option}
              </SelectionTile>
            ))}
          </div>
        );
      case 3:
        return (
          <div className="grid gap-3 md:grid-cols-2">
            {childrenAgeOptions.map((option) => (
              <SelectionTile
                key={option}
                selected={values.childrenAgeProfile === option}
                onClick={() => updateValues({ childrenAgeProfile: option })}
              >
                {option}
              </SelectionTile>
            ))}
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              {dietaryPreferenceOptions.map((option) => (
                <ChoiceChip
                  key={option}
                  selected={values.dietaryPreferences.includes(option)}
                  onClick={() => updateValues({ dietaryPreferences: toggleMultiValue(values.dietaryPreferences, option) })}
                >
                  {option}
                </ChoiceChip>
              ))}
            </div>
            <label className="text-sm text-slate-600">
              Notes
              <textarea
                value={values.dietaryNotes}
                onChange={(event) => updateValues({ dietaryNotes: event.currentTarget.value })}
                className={textareaClassName}
                placeholder="Anything worth remembering about meals, snacks, or food routines?"
              />
            </label>
          </div>
        );
      case 5:
        return (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              {accessibilityNeedOptions.map((option) => (
                <ChoiceChip
                  key={option}
                  selected={values.accessibilityNeeds.includes(option)}
                  onClick={() => updateValues({ accessibilityNeeds: toggleMultiValue(values.accessibilityNeeds, option) })}
                >
                  {option}
                </ChoiceChip>
              ))}
            </div>
            <label className="text-sm text-slate-600">
              Notes
              <textarea
                value={values.accessibilityNotes}
                onChange={(event) => updateValues({ accessibilityNotes: event.currentTarget.value })}
                className={textareaClassName}
                placeholder="Anything Parqara should remember about comfort, pacing, or access needs?"
              />
            </label>
          </div>
        );
      case 6:
        return (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              {planningPriorityOptions.map((option) => {
                const selected = values.planningPriorities.includes(option);
                const disabled = !selected && values.planningPriorities.length >= 3;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={disabled}
                    onClick={() => updateValues({ planningPriorities: toggleLimitedValue(values.planningPriorities, option, 3) })}
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
            <p className="text-sm text-slate-500">{values.planningPriorities.length} of 3 priorities selected.</p>
          </div>
        );
      case 7:
        return (
          <div className="grid gap-3 md:grid-cols-3">
            {planningStyleOptions.map((option) => (
              <SelectionTile
                key={option}
                selected={values.planningStyle === option}
                onClick={() => updateValues({ planningStyle: option })}
              >
                {option}
              </SelectionTile>
            ))}
          </div>
        );
      case 8:
        return (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {budgetPreferenceOptions.map((option) => (
              <SelectionTile
                key={option}
                selected={values.budgetPreference === option}
                onClick={() => updateValues({ budgetPreference: option })}
              >
                {option}
              </SelectionTile>
            ))}
          </div>
        );
      case 9:
        return (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {travelDistanceOptions.map((option) => (
              <SelectionTile
                key={option}
                selected={values.travelDistancePreference === option}
                onClick={() => updateValues({ travelDistancePreference: option })}
              >
                {option}
              </SelectionTile>
            ))}
          </div>
        );
      case 10:
        return (
          <div className="grid gap-3 md:grid-cols-3">
            {planningHelpLevelOptions.map((option) => (
              <SelectionTile
                key={option}
                selected={values.planningHelpLevel === option}
                onClick={() => updateValues({ planningHelpLevel: option })}
              >
                {option}
              </SelectionTile>
            ))}
          </div>
        );
      default:
        return (
          <label className="text-sm text-slate-600">
            Additional notes
            <textarea
              value={values.additionalNotes}
              onChange={(event) => updateValues({ additionalNotes: event.currentTarget.value })}
              className={textareaClassName}
              placeholder="Anything else Parqara should remember for future adventures?"
            />
          </label>
        );
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_360px]">
      <div className="space-y-6">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge variant="info">Onboarding</Badge>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
                  {question.eyebrow} of {onboardingQuestions.length}
                </p>
                <h1 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {question.title}
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">{question.description}</p>
                <p className="mt-2 text-sm text-slate-400">{question.helper}</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">{email}</div>
            </div>

            <div className="space-y-3">
              <Progress value={progress} />
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  {saveState === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin text-teal-700" /> : <Save className="h-4 w-4 text-teal-700" />}
                  <span>
                    {saveState === "saving"
                      ? "Saving progress..."
                      : saveState === "error"
                        ? saveError || "Unable to save progress."
                        : formatSavedAt(lastSavedAt)}
                  </span>
                </div>
                <span>Leave anytime. You will resume right here.</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <div key={question.id} className="animate-[question-rise_260ms_ease]">
            {renderCurrentStep()}
          </div>

          {stepError ? <p className="mt-6 rounded-[22px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{stepError}</p> : null}

          <div className="mt-8 flex flex-col gap-3 border-t border-[#e2e7de] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="secondary" onClick={() => void handleBack()} disabled={currentStep === 0 || isSubmitting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button type="button" size="lg" onClick={() => void handleContinue()} disabled={isSubmitting}>
              {currentStep === onboardingQuestions.length - 1 ? "Finish setup" : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">What this unlocks</p>
          <h2 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
            Faster planning from the very first adventure.
          </h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">Parqara saves the answers as defaults so future planning starts with the right context.</div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">You only need to answer one question at a time, and you can always edit these later in your profile.</div>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Your profile so far</p>
          {summaryItems.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {summaryItems.map((item) => (
                <div key={item} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-slate-600">Your saved defaults will appear here as you answer the questions.</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 text-slate-950">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">
              <Check className="h-4 w-4" />
            </div>
            <p className="font-semibold">You are building reusable defaults</p>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">These answers prefill future adventures so Parqara can get you to a confident plan with less typing every time.</p>
        </Card>
      </div>
    </div>
  );
}


