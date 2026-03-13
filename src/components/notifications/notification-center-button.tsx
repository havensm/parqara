"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

import type { NotificationCenterDto } from "@/lib/contracts";

import { NotificationFeed } from "@/components/notifications/notification-feed";

export function NotificationCenterButton({ initialCenter }: { initialCenter: NotificationCenterDto }) {
  const [isOpen, setIsOpen] = useState(false);
  const [center, setCenter] = useState(initialCenter);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCenter(initialCenter);
  }, [initialCenter]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/86 text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
        aria-label="Open notification inbox"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {center.unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-[#1b6b63] px-1.5 py-1 text-[11px] font-semibold text-white shadow-[0_12px_24px_rgba(27,107,99,0.25)]">
            {center.unreadCount > 9 ? "9+" : center.unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-3 w-[min(30rem,calc(100vw-2rem))]">
          <div className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,252,255,0.94))] p-3 shadow-[0_30px_90px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
            <NotificationFeed initialCenter={center} mode="compact" onNavigate={() => setIsOpen(false)} onCenterChange={setCenter} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
