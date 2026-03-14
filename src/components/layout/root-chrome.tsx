"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const marketingRoutes = [
  "/",
  "/about",
  "/contact",
  "/help",
  "/login",
  "/pricing",
  "/privacy",
  "/roadmap",
  "/signin",
  "/signup",
  "/terms",
] as const;

function isMarketingRoute(pathname: string) {
  return marketingRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }

    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export function RootChrome({
  children,
  footer,
  marketingHeader,
  sidebar,
}: {
  children: ReactNode;
  footer: ReactNode;
  marketingHeader: ReactNode;
  sidebar: ReactNode;
}) {
  const pathname = usePathname() ?? "/";
  const marketingRoute = isMarketingRoute(pathname);

  if (marketingRoute) {
    return (
      <div className="relative isolate min-h-screen overflow-x-clip">
        <div className="mx-auto w-full max-w-[108rem] px-3 py-3 sm:px-5 sm:py-5 lg:px-6 xl:px-8">
          {marketingHeader}
          <main className="relative min-h-[calc(100vh-2rem)] pb-8 sm:pb-12">{children}</main>
          {footer}
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen overflow-x-clip">
      <div className="mx-auto grid w-full max-w-[108rem] gap-4 px-3 py-3 sm:px-5 sm:py-5 lg:grid-cols-[18.5rem_minmax(0,1fr)] lg:gap-5 lg:px-6 xl:grid-cols-[20rem_minmax(0,1fr)] xl:gap-6 xl:px-8">
        <aside className="hidden lg:block lg:sticky lg:top-4 lg:self-start">{sidebar}</aside>
        <div className="min-w-0 lg:pt-1">
          <main className="relative min-h-[calc(100vh-2rem)] pb-8 sm:pb-12">{children}</main>
          {footer}
        </div>
      </div>
    </div>
  );
}

