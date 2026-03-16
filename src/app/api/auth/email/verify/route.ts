import { randomUUID } from "node:crypto";

import { AuthProvider, OnboardingStatus } from "@prisma/client/index";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { consumeEmailVerificationToken } from "@/lib/auth/email-link";
import { getPostAuthRedirectPath } from "@/lib/auth/guards";
import { createSession } from "@/lib/auth/session";
import { getAppOrigin } from "@/lib/auth/google";
import { db } from "@/lib/db";
import { claimPendingTripInvitesForUser } from "@/server/services/trip-service";
import { claimPendingTripPeopleForUser } from "@/server/services/trip-people-service";
import { claimPendingUserContactInvitesForUser } from "@/server/services/user-service";

function redirectToSignIn(request: Request, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, getAppOrigin(request)));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirectToSignIn(request, "email_link_invalid");
  }

  const verification = await consumeEmailVerificationToken(token);

  if (verification.status !== "valid") {
    return redirectToSignIn(request, verification.status === "expired" ? "email_link_expired" : "email_link_invalid");
  }

  const verifiedAt = new Date();
  let user = await db.user.findUnique({
    where: {
      email: verification.email,
    },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        authProvider: AuthProvider.LOCAL,
        email: verification.email,
        emailVerifiedAt: verifiedAt,
        onboardingStatus: OnboardingStatus.COMPLETED,
        onboardingStartedAt: verifiedAt,
        onboardingCompletedAt: verifiedAt,
        passwordHash: await hash(randomUUID(), 10),
      },
    });
  } else if (!user.emailVerifiedAt || user.onboardingStatus !== OnboardingStatus.COMPLETED) {
    user = await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerifiedAt: user.emailVerifiedAt ?? verifiedAt,
        onboardingStatus: OnboardingStatus.COMPLETED,
        onboardingStartedAt: user.onboardingStartedAt ?? verifiedAt,
        onboardingCompletedAt: user.onboardingCompletedAt ?? verifiedAt,
      },
    });
  }

  await claimPendingTripInvitesForUser(user.id, user.email);
    await claimPendingTripPeopleForUser(user.id, user.email);
  await claimPendingUserContactInvitesForUser(user.id, user.email);
  await createSession(user.id);

  return NextResponse.redirect(new URL(getPostAuthRedirectPath(user), getAppOrigin(request)));
}
