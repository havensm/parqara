import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { isAdminEmail } from "@/lib/admin";
import { db } from "@/lib/db";

import { getCurrentUser } from "./session";

export type SessionUserState = Prisma.UserGetPayload<{
  include: {
    preference: true;
  };
}>;

export async function getCurrentUserState(): Promise<SessionUserState | null> {
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
}

export function getPostAuthRedirectPath(user?: unknown) {
  void user;
  return "/dashboard";
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
    redirect("/dashboard");
  }

  return user;
}

export async function requireIncompleteOnboardingUser() {
  redirect("/dashboard");
}
