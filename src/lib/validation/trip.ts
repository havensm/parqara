import { z } from "zod";

import { ADVENTURE_ONBOARDING_STEP_COUNT } from "@/lib/constants";

const timeField = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .or(z.literal(""))
  .transform((value) => (value === "" ? null : value));

const startingLocationField = z
  .string()
  .trim()
  .max(140)
  .or(z.literal(""))
  .or(z.null())
  .transform((value) => {
    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  });

const tripSetupBaseSchema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
  startingLocation: startingLocationField.optional(),
  parkSlug: z.string().min(1),
  visitDate: z.string().date(),
  partySize: z.coerce.number().int().min(1).max(12),
  kidsAges: z.array(z.coerce.number().int().min(0).max(17)).default([]),
  thrillTolerance: z.enum(["LOW", "MEDIUM", "HIGH"]),
  mustDoRideIds: z.array(z.string()).default([]),
  preferredRideTypes: z.array(z.string()).default([]),
  diningPreferences: z.array(z.string()).default([]),
  walkingTolerance: z.enum(["LOW", "MEDIUM", "HIGH"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakStart: timeField.optional().default(null),
  breakEnd: timeField.optional().default(null),
});

const currentStepField = z.coerce.number().int().min(0).max(ADVENTURE_ONBOARDING_STEP_COUNT - 1);

function hasValidBreakWindow(value: { breakStart?: string | null; breakEnd?: string | null }) {
  if (!value.breakStart && !value.breakEnd) {
    return true;
  }

  return Boolean(value.breakStart && value.breakEnd && value.breakStart < value.breakEnd);
}

export const tripSetupSchema = tripSetupBaseSchema.refine(hasValidBreakWindow, {
  message: "Break window must include both start and end times.",
  path: ["breakStart"],
});

export const tripUpdateSchema = tripSetupBaseSchema
  .partial()
  .extend({
    currentStep: currentStepField.optional(),
  })
  .refine(hasValidBreakWindow, {
    message: "Break window must include both start and end times.",
    path: ["breakStart"],
  });
