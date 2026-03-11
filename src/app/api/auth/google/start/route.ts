import { NextResponse } from "next/server";

import { buildGoogleAuthUrl, createGoogleAuthState, isGoogleAuthEnabled } from "@/lib/auth/google";

export async function GET(request: Request) {
  if (!isGoogleAuthEnabled()) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", request.url));
  }

  const state = await createGoogleAuthState();
  return NextResponse.redirect(buildGoogleAuthUrl(request, state));
}
