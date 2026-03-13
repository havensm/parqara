import type { Prisma } from "@prisma/client/index";
import { OnboardingStatus, SubscriptionStatus, SubscriptionTier } from "@prisma/client/index";

import type { ProfilePeopleStateDto, UserPersonDto } from "@/lib/contracts";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { clampOnboardingStep, emptyOnboardingValues, onboardingDraftSchema, onboardingSubmissionSchema, type OnboardingValues } from "@/lib/onboarding";

export type UserWithPreference = Prisma.UserGetPayload<{
  include: {
    preference: true;
  };
}>;

type UserNameRecord = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
};

function buildStoredName(firstName: string | null, lastName: string | null) {
  const parts = [firstName, lastName].filter((value): value is string => Boolean(value && value.trim()));
  return parts.length ? parts.join(" ") : null;
}

function buildDisplayName(user: UserNameRecord) {
  return buildStoredName(user.firstName, user.lastName) ?? user.name ?? user.email;
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

function serializeUserPerson(person: {
  id: string;
  contactUser: UserNameRecord & { id: string };
}): UserPersonDto {
  return {
    id: person.id,
    userId: person.contactUser.id,
    email: person.contactUser.email,
    name: buildDisplayName(person.contactUser),
  };
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

export async function completeFirstTimeWalkthrough(userId: string) {
  return db.user.update({
    where: {
      id: userId,
    },
    data: {
      isFirstTime: false,
    },
    select: {
      isFirstTime: true,
    },
  });
}

export async function resetFirstTimeWalkthrough(userId: string) {
  return db.user.update({
    where: {
      id: userId,
    },
    data: {
      isFirstTime: true,
    },
    select: {
      isFirstTime: true,
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

export async function getProfilePeopleState(userId: string): Promise<ProfilePeopleStateDto> {
  const people = await db.userContact.findMany({
    where: {
      ownerUserId: userId,
    },
    include: {
      contactUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
    },
    orderBy: [
      {
        contactUser: {
          email: "asc",
        },
      },
    ],
  });

  return {
    people: people.map(serializeUserPerson),
  };
}

export async function saveUserPerson(ownerUserId: string, contactUserId: string) {
  if (ownerUserId === contactUserId) {
    return null;
  }

  return db.userContact.upsert({
    where: {
      ownerUserId_contactUserId: {
        ownerUserId,
        contactUserId,
      },
    },
    update: {},
    create: {
      ownerUserId,
      contactUserId,
    },
  });
}

export async function addUserPersonByEmail(ownerUserId: string, email: string): Promise<ProfilePeopleStateDto> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new HttpError(400, "Email is required.");
  }

  const person = await db.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
    },
  });

  if (!person) {
    throw new HttpError(400, "That email does not belong to a Parqara account yet.");
  }

  if (person.id === ownerUserId) {
    throw new HttpError(400, "You already have access to your own planners.");
  }

  await saveUserPerson(ownerUserId, person.id);
  return getProfilePeopleState(ownerUserId);
}

export async function removeUserPerson(ownerUserId: string, personId: string): Promise<ProfilePeopleStateDto> {
  const person = await db.userContact.findFirst({
    where: {
      id: personId,
      ownerUserId,
    },
    select: {
      id: true,
    },
  });

  if (!person) {
    throw new HttpError(404, "Person not found.");
  }

  await db.userContact.delete({
    where: {
      id: person.id,
    },
  });

  return getProfilePeopleState(ownerUserId);
}

function getManualSubscriptionStatus(tier: SubscriptionTier) {
  return tier === SubscriptionTier.FREE ? SubscriptionStatus.INACTIVE : SubscriptionStatus.ACTIVE;
}

export async function adminSetSubscriptionTierByEmail(input: {
  email: string;
  subscriptionTier: SubscriptionTier;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  const user = await db.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const updatedUser = await db.user.update({
    where: {
      id: user.id,
    },
    data: {
      subscriptionTier: input.subscriptionTier,
      subscriptionStatus: getManualSubscriptionStatus(input.subscriptionTier),
      subscriptionCancelAtPeriodEnd: false,
      subscriptionCurrentPeriodEnd: null,
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      name: true,
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  });

  return {
    email: updatedUser.email,
    name: buildStoredName(updatedUser.firstName, updatedUser.lastName) ?? updatedUser.name ?? updatedUser.email,
    subscriptionTier: updatedUser.subscriptionTier,
    subscriptionStatus: updatedUser.subscriptionStatus,
  };
}
