import { randomUUID } from "node:crypto";

import { AuthProvider, OnboardingStatus } from "@prisma/client/index";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { createSession } from "@/lib/auth/session";
import { getPostAuthRedirectPath } from "@/lib/auth/guards";
import {
  consumeGoogleAuthState,
  exchangeGoogleCode,
  getAppOrigin,
  getGoogleUserProfile,
  isGoogleAuthEnabled,
} from "@/lib/auth/google";
import { db } from "@/lib/db";
import { claimPendingTripInvitesForUser } from "@/server/services/trip-service";

function redirectToSignIn(request: Request, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, getAppOrigin(request)));
}

export async function GET(request: Request) {
  if (!isGoogleAuthEnabled()) {
    return redirectToSignIn(request, "google_not_configured");
  }

  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (error) {
    return redirectToSignIn(request, error === "access_denied" ? "google_access_denied" : "google_auth_failed");
  }

  if (!code || !state) {
    return redirectToSignIn(request, "google_missing_code");
  }

  const isValidState = await consumeGoogleAuthState(state);
  if (!isValidState) {
    return redirectToSignIn(request, "google_state_invalid");
  }

  try {
    const accessToken = await exchangeGoogleCode(request, code);
    const profile = await getGoogleUserProfile(accessToken);

    if (!profile.email || !profile.sub || !profile.email_verified) {
      return redirectToSignIn(request, "google_email_unverified");
    }

    const email = profile.email.toLowerCase();
    const verifiedAt = new Date();
    let user = await db.user.findFirst({
      where: {
        OR: [{ googleId: profile.sub }, { email }],
      },
    });

    if (user) {
      const firstName = user.firstName ?? profile.name?.trim().split(/\s+/)[0] ?? null;
      const name = user.name ?? profile.name?.trim() ?? firstName;
      user = await db.user.update({
        where: { id: user.id },
        data: {
          emailVerifiedAt: user.emailVerifiedAt ?? verifiedAt,
          firstName,
          googleId: user.googleId ?? profile.sub,
          name,
          onboardingStatus: OnboardingStatus.COMPLETED,
          onboardingStartedAt: user.onboardingStartedAt ?? verifiedAt,
          onboardingCompletedAt: user.onboardingCompletedAt ?? verifiedAt,
        },
      });
    } else {
      const fullName = profile.name?.trim() ?? email.split("@")[0];
      const firstName = fullName.split(/\s+/)[0] ?? fullName;
      user = await db.user.create({
        data: {
          authProvider: AuthProvider.GOOGLE,
          email,
          emailVerifiedAt: verifiedAt,
          firstName,
          googleId: profile.sub,
          name: fullName,
          onboardingStatus: OnboardingStatus.COMPLETED,
          onboardingStartedAt: verifiedAt,
          onboardingCompletedAt: verifiedAt,
          passwordHash: await hash(randomUUID(), 10),
        },
      });
    }

    await claimPendingTripInvitesForUser(user.id, user.email);
    await createSession(user.id);
    return NextResponse.redirect(new URL(getPostAuthRedirectPath(user), getAppOrigin(request)));
  } catch {
    return redirectToSignIn(request, "google_auth_failed");
  }
}
