import { NextResponse } from "next/server";

import { issueEmailVerificationLink } from "@/lib/auth/email-link";
import { emailLinkSchema } from "@/lib/validation/auth";
import { apiError } from "@/app/api/_utils";

export async function POST(request: Request) {
  try {
    const body = emailLinkSchema.parse(await request.json());
    const result = await issueEmailVerificationLink(request, body.email, body.intent);

    return NextResponse.json({
      message:
        body.intent === "signup"
          ? "Check your inbox for a verification link to finish creating your account."
          : "Check your inbox for a secure sign-in link.",
      ok: true,
      previewUrl: result.delivery === "preview" ? result.verificationUrl : undefined,
    });
  } catch (error) {
    return apiError(error);
  }
}
