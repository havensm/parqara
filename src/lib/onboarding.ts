import { z } from "zod";

import { USER_ONBOARDING_STEP_COUNT } from "@/lib/constants";

export const adventureTypeOptions = [
  "Theme parks",
  "Zoos & aquariums",
  "Beaches",
  "City outings",
  "Museums",
  "Outdoor nature trips",
  "Road trips",
  "Family vacations",
  "Weekend getaways",
  "Other",
] as const;

export const groupSizeOptions = ["Just me", "2 people", "3-4 people", "5-6 people", "7+ people"] as const;
export const childrenAgeOptions = ["No", "Yes, infants/toddlers", "Yes, kids", "Yes, teens", "Mixed ages"] as const;
export const dietaryPreferenceOptions = [
  "None",
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Nut allergy",
  "Halal",
  "Kosher",
  "Picky eaters",
  "Other",
] as const;
export const accessibilityNeedOptions = [
  "None",
  "Mobility support",
  "Wheelchair accessibility",
  "Stroller-friendly routes",
  "Sensory-friendly options",
  "Quiet/rest areas preferred",
  "Medical planning considerations",
  "Other",
] as const;
export const planningPriorityOptions = [
  "Save money",
  "Save time",
  "Avoid stress",
  "Kid-friendly options",
  "Food quality",
  "Flexible schedule",
  "Efficient route",
  "Must-see highlights",
  "Comfort",
  "Accessibility",
] as const;
export const planningStyleOptions = ["Relaxed and flexible", "Balanced", "Efficient and packed"] as const;
export const budgetPreferenceOptions = ["Budget-conscious", "Moderate", "Premium", "It depends"] as const;
export const travelDistanceOptions = ["Stay local", "Short drive", "Day trip", "Weekend distance", "Open to anything"] as const;
export const planningHelpLevelOptions = ["Just recommendations", "A suggested itinerary", "A full trip plan"] as const;

const shortTextField = z.string().trim().max(80).default("");
const notesField = z.string().trim().max(400).default("");

export const onboardingDraftSchema = z.object({
  firstName: shortTextField,
  lastName: shortTextField,
  preferredAdventureTypes: z.array(z.string()).max(10).default([]),
  typicalGroupSize: shortTextField,
  childrenAgeProfile: shortTextField,
  dietaryPreferences: z.array(z.string()).max(10).default([]),
  dietaryNotes: notesField,
  accessibilityNeeds: z.array(z.string()).max(8).default([]),
  accessibilityNotes: notesField,
  planningPriorities: z.array(z.string()).max(3).default([]),
  planningStyle: shortTextField,
  budgetPreference: shortTextField,
  travelDistancePreference: shortTextField,
  planningHelpLevel: shortTextField,
  additionalNotes: notesField,
});

export const onboardingSubmissionSchema = onboardingDraftSchema.extend({
  currentStep: z.coerce.number().int().min(0).max(USER_ONBOARDING_STEP_COUNT - 1),
  complete: z.boolean().optional().default(false),
}).superRefine((value, ctx) => {
  if (!value.complete) {
    return;
  }

  if (!value.firstName) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["firstName"], message: "First name is required." });
  }

  if (value.preferredAdventureTypes.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["preferredAdventureTypes"], message: "Choose at least one adventure type." });
  }

  if (!value.typicalGroupSize) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["typicalGroupSize"], message: "Choose a typical group size." });
  }

  if (!value.childrenAgeProfile) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["childrenAgeProfile"], message: "Choose a child age profile." });
  }

  if (value.dietaryPreferences.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dietaryPreferences"], message: "Choose at least one dietary preference." });
  }

  if (value.accessibilityNeeds.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["accessibilityNeeds"], message: "Choose at least one accessibility option." });
  }

  if (value.planningPriorities.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["planningPriorities"], message: "Choose at least one planning priority." });
  }

  if (!value.planningStyle) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["planningStyle"], message: "Choose a planning style." });
  }

  if (!value.budgetPreference) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["budgetPreference"], message: "Choose a budget preference." });
  }

  if (!value.travelDistancePreference) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["travelDistancePreference"], message: "Choose a travel distance preference." });
  }

  if (!value.planningHelpLevel) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["planningHelpLevel"], message: "Choose a planning help level." });
  }
});

export type OnboardingValues = z.infer<typeof onboardingDraftSchema>;

export const emptyOnboardingValues: OnboardingValues = {
  firstName: "",
  lastName: "",
  preferredAdventureTypes: [],
  typicalGroupSize: "",
  childrenAgeProfile: "",
  dietaryPreferences: [],
  dietaryNotes: "",
  accessibilityNeeds: [],
  accessibilityNotes: "",
  planningPriorities: [],
  planningStyle: "",
  budgetPreference: "",
  travelDistancePreference: "",
  planningHelpLevel: "",
  additionalNotes: "",
};

export const onboardingQuestions = [
  {
    eyebrow: "Step 1",
    id: "name",
    title: "What should we call you?",
    description: "We will use this to personalize the app and future trip plans.",
    helper: "You can always update this later.",
    kind: "name" as const,
  },
  {
    eyebrow: "Step 2",
    id: "preferredAdventureTypes",
    title: "What type of adventures are you most interested in?",
    description: "Pick the outings you want Parqara to get better at planning for you.",
    helper: "Choose as many as fit.",
    kind: "multi" as const,
  },
  {
    eyebrow: "Step 3",
    id: "typicalGroupSize",
    title: "How many people do you usually plan for?",
    description: "This helps Parqara set the right pace from the start.",
    helper: "Choose the group size that feels most typical.",
    kind: "single" as const,
  },
  {
    eyebrow: "Step 4",
    id: "childrenAgeProfile",
    title: "Are children usually part of the trip?",
    description: "We will keep age fit, pacing, and comfort in mind.",
    helper: "Pick the option that is usually true for your trips.",
    kind: "single" as const,
  },
  {
    eyebrow: "Step 5",
    id: "dietaryPreferences",
    title: "Do you have any dietary restrictions or food preferences we should keep in mind?",
    description: "These defaults will carry into future recommendations automatically.",
    helper: "Choose any that apply and add notes if needed.",
    kind: "multi-with-notes" as const,
  },
  {
    eyebrow: "Step 6",
    id: "accessibilityNeeds",
    title: "Do any travelers have accessibility or special needs we should plan around?",
    description: "Parqara can use these details to suggest more comfortable options and routes.",
    helper: "Choose any that matter and add notes if helpful.",
    kind: "multi-with-notes" as const,
  },
  {
    eyebrow: "Step 7",
    id: "planningPriorities",
    title: "What matters most when planning a trip?",
    description: "This tells Parqara what to optimize for first.",
    helper: "Choose up to 3 priorities.",
    kind: "multi-limited" as const,
  },
  {
    eyebrow: "Step 8",
    id: "planningStyle",
    title: "How do you like your plans to feel?",
    description: "Some people want room to wander. Others want every hour dialed in.",
    helper: "Pick the style that feels most natural.",
    kind: "single" as const,
  },
  {
    eyebrow: "Step 9",
    id: "budgetPreference",
    title: "What budget range do you usually want to stay within?",
    description: "This helps Parqara balance recommendations and tradeoffs.",
    helper: "Choose the range that fits most often.",
    kind: "single" as const,
  },
  {
    eyebrow: "Step 10",
    id: "travelDistancePreference",
    title: "How far are you usually willing to travel?",
    description: "We will use this to shape future suggestions and planning ideas.",
    helper: "Choose the distance that feels realistic most of the time.",
    kind: "single" as const,
  },
  {
    eyebrow: "Step 11",
    id: "planningHelpLevel",
    title: "How much help do you want from Parqara?",
    description: "You can keep things light or let Parqara do more of the heavy lifting.",
    helper: "Choose the level of planning support you want by default.",
    kind: "single" as const,
  },
  {
    eyebrow: "Step 12",
    id: "additionalNotes",
    title: "Is there anything else we should remember for future adventures?",
    description: "Add anything that does not fit cleanly into the earlier questions.",
    helper: "This step is optional.",
    kind: "notes" as const,
  },
] as const;

export function getOnboardingProgress(currentStep: number) {
  return ((currentStep + 1) / USER_ONBOARDING_STEP_COUNT) * 100;
}

export function clampOnboardingStep(step: number) {
  return Math.min(Math.max(step, 0), USER_ONBOARDING_STEP_COUNT - 1);
}

export function buildDisplayName(firstName: string | null | undefined, fallback: string) {
  return firstName?.trim() || fallback;
}

export function buildPreferenceSummary(values: OnboardingValues) {
  const summary: string[] = [];

  if (values.typicalGroupSize) {
    summary.push(`Planning for ${values.typicalGroupSize.toLowerCase()}`);
  }

  if (values.childrenAgeProfile && values.childrenAgeProfile !== "No") {
    summary.push(values.childrenAgeProfile.replace("Yes, ", "").replace("Mixed ages", "Mixed ages in the group"));
  }

  if (values.planningStyle) {
    summary.push(`${values.planningStyle} plans`);
  }

  if (values.budgetPreference) {
    summary.push(`${values.budgetPreference} budget`);
  }

  return summary;
}

export function shouldTreatAsNoneSelection(currentValues: string[], option: string) {
  return option === "None" || currentValues.includes("None");
}

