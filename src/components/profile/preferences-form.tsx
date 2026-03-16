"use client";

import type { ChangeEvent, ReactNode } from "react";
import { CheckCircle2, ImagePlus, LoaderCircle, Save, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import {
  accessibilityNeedOptions,
  adventureTypeOptions,
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
import {
  PROFILE_IMAGE_MAX_DATA_URL_LENGTH,
  PROFILE_IMAGE_MAX_DIMENSION,
  type ProfileSettingsValues,
} from "@/lib/profile";
import { cn } from "@/lib/utils";

import { ChoiceChip, SelectionTile } from "@/components/onboarding/selection-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const inputClassName =
  "mt-3 w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3.5 text-slate-950 outline-none ring-0 transition focus:border-[#1b6b63]/40";
const textareaClassName =
  "mt-3 min-h-28 w-full rounded-[22px] border border-slate-200 bg-white px-4 py-3.5 text-slate-950 outline-none ring-0 transition focus:border-[#1b6b63]/40";

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

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "P";
}

function buildDisplayName(values: { firstName: string; lastName: string }, userEmail: string) {
  const displayName = [values.firstName, values.lastName].filter((value) => value.trim()).join(" ").trim();
  return displayName || userEmail;
}

async function createProfileImageDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a PNG, JPG, or WebP image.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Could not read that image."));
      nextImage.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    const longestSide = Math.max(image.width, image.height);
    const scale = longestSide > PROFILE_IMAGE_MAX_DIMENSION ? PROFILE_IMAGE_MAX_DIMENSION / longestSide : 1;

    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not prepare that image.");
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const profileImageDataUrl = canvas.toDataURL("image/webp", 0.86);

    if (!profileImageDataUrl.startsWith("data:image/")) {
      throw new Error("Could not prepare that image.");
    }

    if (profileImageDataUrl.length > PROFILE_IMAGE_MAX_DATA_URL_LENGTH) {
      throw new Error("Choose a smaller image with less detail.");
    }

    return profileImageDataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ProfilePreferencesForm({
  initialValues,
  initialProfileImageDataUrl = null,
  userEmail,
}: {
  initialValues: OnboardingValues;
  initialProfileImageDataUrl?: string | null;
  userEmail: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [values, setValues] = useState<ProfileSettingsValues>({
    ...initialValues,
    profileImageDataUrl: initialProfileImageDataUrl,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateValues(nextValues: Partial<ProfileSettingsValues>) {
    setMessage(null);
    setError(null);
    setValues((current) => ({ ...current, ...nextValues }));
  }

  async function handleProfileImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }

    setMessage(null);
    setError(null);
    setIsPreparingImage(true);

    try {
      const profileImageDataUrl = await createProfileImageDataUrl(file);
      updateValues({ profileImageDataUrl });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not prepare that image.");
    } finally {
      setIsPreparingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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

      setMessage("Profile saved.");
    });
  }

  const displayName = buildDisplayName(values, userEmail);
  const initials = getInitials(displayName);

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[15rem_minmax(0,1fr)] xl:items-start">
          <div className="rounded-[26px] border border-slate-200 bg-slate-50/90 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Profile photo</p>
            <div className="mt-4 flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 border border-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                {values.profileImageDataUrl ? <AvatarImage src={values.profileImageDataUrl} alt={`${displayName} profile photo`} /> : null}
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <p className="mt-4 text-sm font-semibold text-slate-950">Used on your profile</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">Upload a PNG, JPG, or WebP image.</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <label className={buttonStyles({ variant: "secondary", size: "default" }) + " cursor-pointer"}>
                {isPreparingImage ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                {isPreparingImage ? "Preparing..." : values.profileImageDataUrl ? "Replace image" : "Upload image"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={isPreparingImage || isPending}
                  onChange={(event) => void handleProfileImageChange(event)}
                />
              </label>
              {values.profileImageDataUrl ? (
                <Button type="button" variant="ghost" disabled={isPreparingImage || isPending} onClick={() => updateValues({ profileImageDataUrl: null })}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              ) : null}
            </div>
          </div>

          <div>
            <SectionHeader title="Account" description="The basics shown across your planners and shared workspace." />
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                First name
                <input value={values.firstName} onChange={(event) => updateValues({ firstName: event.currentTarget.value })} className={inputClassName} />
              </label>
              <label className="text-sm text-slate-600">
                Last name
                <input value={values.lastName} onChange={(event) => updateValues({ lastName: event.currentTarget.value })} className={inputClassName} />
              </label>
            </div>
            <div className="mt-5 rounded-[22px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Account email</p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{userEmail}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <SectionHeader title="Planning defaults" description="What Mara should assume first when a new planner starts." />
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <DefaultsPanel title="Common plans" description="Who and what you usually plan for.">
            <div className="space-y-6">
              <FieldGroup title="Adventure types" description="What you open most often.">
                <div className="flex flex-wrap gap-3">
                  {adventureTypeOptions.map((option) => (
                    <ChoiceChip
                      key={option}
                      selected={values.preferredAdventureTypes.includes(option)}
                      onClick={() => updateValues({ preferredAdventureTypes: toggleMultiValue(values.preferredAdventureTypes, option) })}
                    >
                      {option}
                    </ChoiceChip>
                  ))}
                </div>
              </FieldGroup>

              <FieldGroup title="Typical group size" description="Who you usually plan for.">
                <div className="flex flex-wrap gap-3">
                  {groupSizeOptions.map((option) => (
                    <ChoiceChip key={option} selected={values.typicalGroupSize === option} onClick={() => updateValues({ typicalGroupSize: option })}>
                      {option}
                    </ChoiceChip>
                  ))}
                </div>
              </FieldGroup>

              <FieldGroup title="Children in the mix" description="Useful for pace and fit.">
                <div className="flex flex-wrap gap-3">
                  {childrenAgeOptions.map((option) => (
                    <ChoiceChip key={option} selected={values.childrenAgeProfile === option} onClick={() => updateValues({ childrenAgeProfile: option })}>
                      {option}
                    </ChoiceChip>
                  ))}
                </div>
              </FieldGroup>
            </div>
          </DefaultsPanel>

          <DefaultsPanel title="Guardrails" description="The boundaries Mara should protect first.">
            <div className="space-y-6">
              <FieldGroup title="Budget" description="How expensive a plan should feel.">
                <div className="flex flex-wrap gap-3">
                  {budgetPreferenceOptions.map((option) => (
                    <ChoiceChip key={option} selected={values.budgetPreference === option} onClick={() => updateValues({ budgetPreference: option })}>
                      {option}
                    </ChoiceChip>
                  ))}
                </div>
              </FieldGroup>

              <FieldGroup title="Travel distance" description="How far you usually want to go.">
                <div className="flex flex-wrap gap-3">
                  {travelDistanceOptions.map((option) => (
                    <ChoiceChip
                      key={option}
                      selected={values.travelDistancePreference === option}
                      onClick={() => updateValues({ travelDistancePreference: option })}
                    >
                      {option}
                    </ChoiceChip>
                  ))}
                </div>
              </FieldGroup>

              <FieldGroup title="Top priorities" description="Choose up to three things Mara should optimize for.">
                <div className="flex flex-wrap gap-3">
                  {planningPriorityOptions.map((option) => {
                    const selected = values.planningPriorities.includes(option);
                    const disabled = !selected && values.planningPriorities.length >= 3;
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={disabled}
                        onClick={() => updateValues({ planningPriorities: togglePriority(values.planningPriorities, option) })}
                        className={cn(
                          "rounded-full border px-4 py-2.5 text-sm font-semibold transition",
                          selected
                            ? "border-[#b9ddd6] bg-[#edf8f4] text-[#18544d]"
                            : disabled
                              ? "border-slate-200 bg-slate-50 text-slate-300"
                              : "border-slate-200 bg-white text-slate-600 hover:border-[#c9d8d1]"
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </FieldGroup>
            </div>
          </DefaultsPanel>

          <DefaultsPanel title="Mara style" description="How structured and hands-on planning should feel." className="xl:col-span-2">
            <div className="grid gap-6 lg:grid-cols-2">
              <FieldGroup title="Plan feel" description="How structured you want plans to feel.">
                <div className="grid gap-3">
                  {planningStyleOptions.map((option) => (
                    <SelectionTile key={option} selected={values.planningStyle === option} onClick={() => updateValues({ planningStyle: option })}>
                      {option}
                    </SelectionTile>
                  ))}
                </div>
              </FieldGroup>

              <FieldGroup title="Help level" description="How much Mara should do by default.">
                <div className="grid gap-3">
                  {planningHelpLevelOptions.map((option) => (
                    <SelectionTile key={option} selected={values.planningHelpLevel === option} onClick={() => updateValues({ planningHelpLevel: option })}>
                      {option}
                    </SelectionTile>
                  ))}
                </div>
              </FieldGroup>
            </div>
          </DefaultsPanel>
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <SectionHeader title="Trip notes" description="Details that should follow every plan automatically." />
        <div className="mt-6 grid gap-8 xl:grid-cols-2">
          <FieldGroup title="Dietary preferences" description="Food constraints and preferences.">
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
            <label className="mt-4 block text-sm text-slate-600">
              Notes
              <textarea value={values.dietaryNotes} onChange={(event) => updateValues({ dietaryNotes: event.currentTarget.value })} className={textareaClassName} />
            </label>
          </FieldGroup>

          <FieldGroup title="Accessibility needs" description="Comfort and route considerations.">
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
            <label className="mt-4 block text-sm text-slate-600">
              Notes
              <textarea value={values.accessibilityNotes} onChange={(event) => updateValues({ accessibilityNotes: event.currentTarget.value })} className={textareaClassName} />
            </label>
          </FieldGroup>
        </div>

        <label className="mt-6 block text-sm text-slate-600">
          Anything else Mara should remember?
          <textarea value={values.additionalNotes} onChange={(event) => updateValues({ additionalNotes: event.currentTarget.value })} className={textareaClassName} />
        </label>
      </Card>

      <div className="flex flex-col gap-3 rounded-[26px] border border-[var(--card-border)] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {message ? (
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#18544d]">
              <CheckCircle2 className="h-4 w-4" /> {message}
            </p>
          ) : null}
          {error ? <p className="text-sm font-semibold text-[#b14b41]">{error}</p> : null}
        </div>
        <Button type="button" size="lg" disabled={isPending || isPreparingImage} onClick={saveProfile}>
          {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save changes
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

function DefaultsPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 sm:p-6", className)}>
      <div>
        <p className="text-lg font-semibold text-slate-950">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function FieldGroup({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
