"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteScrollManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousRouteRef = useRef<string | null>(null);
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    if (previousRouteRef.current !== null && previousRouteRef.current !== routeKey) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    previousRouteRef.current = routeKey;
  }, [routeKey]);

  return null;
}
