import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { createSession } from "@/lib/auth/session";
import { getPostAuthRedirectPath } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { signInSchema } from "@/lib/validation/auth";
import { apiError } from "@/app/api/_utils";

export async function POST(request: Request) {
  try {
    const body = signInSchema.parse(await request.json());
    const user = await db.user.findUnique({
      where: {
        email: body.email.toLowerCase(),
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValidPassword = await compare(body.password, user.passwordHash);
    if (!isValidPassword) {
      if (user.googleId) {
        return NextResponse.json({ error: "This account is best accessed with Google or a verified email link." }, { status: 401 });
      }

      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({ nextPath: getPostAuthRedirectPath(user), ok: true });
  } catch (error) {
    return apiError(error);
  }
}
