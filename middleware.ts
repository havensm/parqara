import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { hasPreviewAccess, isPreviewAccessEnabled, PREVIEW_ACCESS_COOKIE_NAME } from "@/lib/preview-access";

export async function middleware(request: NextRequest) {
  if (!isPreviewAccessEnabled()) {
    return NextResponse.next();
  }

  const hasAccess = await hasPreviewAccess(request.cookies.get(PREVIEW_ACCESS_COOKIE_NAME)?.value);
  if (hasAccess) {
    return NextResponse.next();
  }

  const accessUrl = new URL("/access.html", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (nextPath !== "/") {
    accessUrl.searchParams.set("next", nextPath);
  }

  return NextResponse.redirect(accessUrl);
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
