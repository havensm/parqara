"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteScrollManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousRouteRef = useRef<string | null>(null);
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    const hash = window.location.hash;
    let frame = 0;

    if (previousRouteRef.current !== null && previousRouteRef.current !== routeKey) {
      if (hash) {
        const anchorId = decodeURIComponent(hash.slice(1));
        frame = window.requestAnimationFrame(() => {
          document.getElementById(anchorId)?.scrollIntoView();
        });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    }

    previousRouteRef.current = routeKey;

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [routeKey]);

  return null;
}

