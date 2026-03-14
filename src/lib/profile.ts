import { z } from "zod";

import { onboardingDraftSchema, type OnboardingValues } from "@/lib/onboarding";

export const PROFILE_IMAGE_MAX_DATA_URL_LENGTH = 2_500_000;
export const PROFILE_IMAGE_MAX_DIMENSION = 512;

export const profileImageDataUrlSchema = z.string().trim().startsWith("data:image/").max(PROFILE_IMAGE_MAX_DATA_URL_LENGTH);

export const profileSettingsSchema = onboardingDraftSchema.extend({
  profileImageDataUrl: profileImageDataUrlSchema.nullable().optional(),
});

export type ProfileSettingsValues = OnboardingValues & {
  profileImageDataUrl: string | null;
};
