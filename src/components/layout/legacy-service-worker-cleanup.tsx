"use client";

import { useEffect } from "react";

export function LegacyServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (sessionStorage.getItem("parqara-sw-cleanup-complete")) {
      return;
    }

    let cancelled = false;

    const cleanup = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (!registrations.length) {
          return;
        }

        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        }

        if (cancelled) {
          return;
        }

        sessionStorage.setItem("parqara-sw-cleanup-complete", "1");
        window.location.reload();
      } catch {
        // Ignore cleanup failures so the shell can continue rendering.
      }
    };

    void cleanup();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
