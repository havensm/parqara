import { cache } from "react";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client/index";

import { isAdminEmail } from "@/lib/admin";
import { db, isDatabaseUnavailableError } from "@/lib/db";

import { getCurrentUser } from "./session";

export type SessionUserState = Prisma.UserGetPayload<{
  include: {
    preference: true;
  };
}>;

const loadCurrentUserState = cache(async (): Promise<SessionUserState | null> => {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return db.user.findUnique({
    where: {
      id: user.id,
    },
    include: {
      preference: true,
    },
  });
});

export async function getCurrentUserState(): Promise<SessionUserState | null> {
  return loadCurrentUserState();
}

export async function getCurrentUserStateIfAvailable(): Promise<SessionUserState | null> {
  try {
    return await loadCurrentUserState();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return null;
    }

    throw error;
  }
}

export function getPostAuthRedirectPath(user?: unknown) {
  void user;
  return "/app";
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUserState();
  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireCompletedOnboardingUser() {
  return requireAuthenticatedUser();
}

export async function requireAdminUser() {
  const user = await requireAuthenticatedUser();
  if (!isAdminEmail(user.email)) {
    redirect("/app");
  }

  return user;
}

export async function requireIncompleteOnboardingUser() {
  redirect("/app");
}
