import { NextResponse } from "next/server";

import {
  createPreviewAccessToken,
  getPreviewAccessCookieOptions,
  getPreviewAccessPassword,
  isPreviewAccessEnabled,
  PREVIEW_ACCESS_COOKIE_NAME,
} from "@/lib/preview-access";

function shouldUseSecureCookie(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  if (!isPreviewAccessEnabled()) {
    return NextResponse.json({ ok: true });
  }

  let password = "";

  try {
    const body = (await request.json()) as { password?: string };
    password = String(body.password ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (password !== getPreviewAccessPassword()) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    PREVIEW_ACCESS_COOKIE_NAME,
    await createPreviewAccessToken(),
    getPreviewAccessCookieOptions(shouldUseSecureCookie(request))
  );
  return response;
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PREVIEW_ACCESS_COOKIE_NAME, "", {
    ...getPreviewAccessCookieOptions(shouldUseSecureCookie(request)),
    expires: new Date(0),
    maxAge: 0,
  });
  return response;
}
