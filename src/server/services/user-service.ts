import type { Prisma } from "@prisma/client";
import { OnboardingStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { clampOnboardingStep, emptyOnboardingValues, onboardingDraftSchema, onboardingSubmissionSchema, type OnboardingValues } from "@/lib/onboarding";

export type UserWithPreference = Prisma.UserGetPayload<{
  include: {
    preference: true;
  };
}>;

function buildStoredName(firstName: string | null, lastName: string | null) {
  const parts = [firstName, lastName].filter((value): value is string => Boolean(value && value.trim()));
  return parts.length ? parts.join(" ") : null;
}

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toOnboardingValues(user: UserWithPreference): OnboardingValues {
  return onboardingDraftSchema.parse({
    ...emptyOnboardingValues,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    preferredAdventureTypes: user.preference?.preferredAdventureTypes ?? [],
    typicalGroupSize: user.preference?.typicalGroupSize ?? "",
    childrenAgeProfile: user.preference?.childrenAgeProfile ?? "",
    dietaryPreferences: user.preference?.dietaryPreferences ?? [],
    dietaryNotes: user.preference?.dietaryNotes ?? "",
    accessibilityNeeds: user.preference?.accessibilityNeeds ?? [],
    accessibilityNotes: user.preference?.accessibilityNotes ?? "",
    planningPriorities: user.preference?.planningPriorities ?? [],
    planningStyle: user.preference?.planningStyle ?? "",
    budgetPreference: user.preference?.budgetPreference ?? "",
    travelDistancePreference: user.preference?.travelDistancePreference ?? "",
    planningHelpLevel: user.preference?.planningHelpLevel ?? "",
    additionalNotes: user.preference?.additionalNotes ?? "",
  });
}

export async function getUserWithPreference(userId: string) {
  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      preference: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
}

export async function getOnboardingState(userId: string) {
  const user = await getUserWithPreference(userId);

  return {
    completed: user.onboardingStatus === OnboardingStatus.COMPLETED,
    currentStep: clampOnboardingStep(user.onboardingCurrentStep),
    status: user.onboardingStatus,
    values: toOnboardingValues(user),
  };
}

async function upsertUserPreference(userId: string, values: OnboardingValues) {
  return db.userPreference.upsert({
    where: {
      userId,
    },
    update: {
      preferredAdventureTypes: values.preferredAdventureTypes,
      typicalGroupSize: toNullable(values.typicalGroupSize),
      childrenAgeProfile: toNullable(values.childrenAgeProfile),
      dietaryPreferences: values.dietaryPreferences,
      dietaryNotes: toNullable(values.dietaryNotes),
      accessibilityNeeds: values.accessibilityNeeds,
      accessibilityNotes: toNullable(values.accessibilityNotes),
      planningPriorities: values.planningPriorities,
      planningStyle: toNullable(values.planningStyle),
      budgetPreference: toNullable(values.budgetPreference),
      travelDistancePreference: toNullable(values.travelDistancePreference),
      planningHelpLevel: toNullable(values.planningHelpLevel),
      additionalNotes: toNullable(values.additionalNotes),
    },
    create: {
      userId,
      preferredAdventureTypes: values.preferredAdventureTypes,
      typicalGroupSize: toNullable(values.typicalGroupSize),
      childrenAgeProfile: toNullable(values.childrenAgeProfile),
      dietaryPreferences: values.dietaryPreferences,
      dietaryNotes: toNullable(values.dietaryNotes),
      accessibilityNeeds: values.accessibilityNeeds,
      accessibilityNotes: toNullable(values.accessibilityNotes),
      planningPriorities: values.planningPriorities,
      planningStyle: toNullable(values.planningStyle),
      budgetPreference: toNullable(values.budgetPreference),
      travelDistancePreference: toNullable(values.travelDistancePreference),
      planningHelpLevel: toNullable(values.planningHelpLevel),
      additionalNotes: toNullable(values.additionalNotes),
    },
  });
}

export async function saveOnboardingProgress(userId: string, input: unknown) {
  const submission = onboardingSubmissionSchema.parse(input);
  const user = await getUserWithPreference(userId);
  const firstName = toNullable(submission.firstName);
  const lastName = toNullable(submission.lastName);
  const now = new Date();

  await upsertUserPreference(userId, submission);

  await db.user.update({
    where: {
      id: userId,
    },
    data: {
      firstName,
      lastName,
      name: buildStoredName(firstName, lastName) ?? user.name,
      onboardingStatus: submission.complete ? OnboardingStatus.COMPLETED : OnboardingStatus.IN_PROGRESS,
      onboardingCurrentStep: submission.complete ? clampOnboardingStep(submission.currentStep) : clampOnboardingStep(submission.currentStep),
      onboardingStartedAt: user.onboardingStartedAt ?? now,
      onboardingCompletedAt: submission.complete ? now : null,
    },
  });

  return getOnboardingState(userId);
}

export async function recordMaraStarterReply(userId: string) {
  return db.user.update({
    where: {
      id: userId,
    },
    data: {
      maraPreviewRepliesUsed: {
        increment: 1,
      },
    },
    select: {
      maraPreviewRepliesUsed: true,
    },
  });
}
export async function updateProfilePreferences(userId: string, input: unknown) {
  const values = onboardingDraftSchema.parse(input);
  const user = await getUserWithPreference(userId);
  const firstName = toNullable(values.firstName);
  const lastName = toNullable(values.lastName);

  await upsertUserPreference(userId, values);

  await db.user.update({
    where: {
      id: userId,
    },
    data: {
      firstName,
      lastName,
      name: buildStoredName(firstName, lastName) ?? user.name,
    },
  });

  return getOnboardingState(userId);
}

