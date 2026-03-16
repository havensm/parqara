import { hash } from "bcryptjs";
import { AuthProvider, OnboardingStatus } from "@prisma/client/index";
import { NextResponse } from "next/server";

import { apiError } from "@/app/api/_utils";
import { getPostAuthRedirectPath } from "@/lib/auth/guards";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { signUpSchema } from "@/lib/validation/auth";
import { claimPendingTripInvitesForUser } from "@/server/services/trip-service";
import { claimPendingUserContactInvitesForUser } from "@/server/services/user-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = signUpSchema.parse(await request.json());
    const existingUser = await db.user.findUnique({
      where: {
        email: body.email.toLowerCase(),
      },
    });

    if (existingUser) {
      const error = existingUser.googleId
        ? "An account with that email already exists. Continue with Google or request a verified email link instead."
        : "An account with that email already exists.";

      return NextResponse.json({ error }, { status: 409 });
    }

    const firstName = body.firstName.trim();
    const now = new Date();
    const user = await db.user.create({
      data: {
        authProvider: AuthProvider.LOCAL,
        email: body.email.toLowerCase(),
        firstName,
        name: firstName,
        onboardingStatus: OnboardingStatus.COMPLETED,
        onboardingStartedAt: now,
        onboardingCompletedAt: now,
        passwordHash: await hash(body.password, 10),
      },
    });

    await claimPendingTripInvitesForUser(user.id, user.email);
    await claimPendingUserContactInvitesForUser(user.id, user.email);
    await createSession(user.id);
    return NextResponse.json({ nextPath: getPostAuthRedirectPath(user), ok: true });
  } catch (error) {
    return apiError(error);
  }
}
