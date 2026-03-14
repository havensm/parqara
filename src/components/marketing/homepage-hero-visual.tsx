"use client";

import Image from "next/image";
import { CalendarDays, CloudSun, Sparkles } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";

import { MaraPortrait } from "@/components/assistant/mara-portrait";

const heroSurfaces = [
  {
    label: "Shared plan",
    icon: CalendarDays,
    status: "The group plan is aligned before the day starts.",
    action: "Review shared plan",
    key: "plan",
  },
  {
    label: "Route board",
    icon: Sparkles,
    status: "The next two anchors are already lined up.",
    action: "Open route board",
    key: "route",
  },
  {
    label: "Live updates",
    icon: CloudSun,
    status: "Weather and ride changes stay attached to the trip.",
    action: "Watch live updates",
    key: "live",
  },
] as const;

export function HomepageHeroVisual() {
  const [activeSurface, setActiveSurface] = useRotatingIndex(heroSurfaces.length, 2600);

  return (
    <div
      data-testid="homepage-hero-visual"
      className="relative overflow-hidden rounded-[34px] border border-white/85 bg-[linear-gradient(160deg,rgba(247,252,252,0.98),rgba(238,247,249,0.94))] p-4 shadow-[0_26px_70px_rgba(15,23,42,0.08)] sm:p-5 lg:p-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(20,184,166,0.08),transparent_26%),radial-gradient(circle_at_84%_14%,rgba(96,165,250,0.12),transparent_24%),radial-gradient(circle_at_54%_84%,rgba(255,255,255,0.2),transparent_32%)]" />

      <div className="relative space-y-4">
        <div className="flex flex-wrap gap-2">
          {heroSurfaces.map(({ label, icon: Icon }, index) => {
            const isActive = index === activeSurface;

            return (
              <button
                key={label}
                type="button"
                onMouseEnter={() => setActiveSurface(index)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
                  isActive
                    ? "border-teal-100 bg-teal-50 text-teal-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                    : "border-white/90 bg-white/86 text-slate-500"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.06fr)_minmax(260px,0.94fr)]">
          <div className="space-y-3">
            <div
              data-testid="hero-route-card"
              className={`overflow-hidden rounded-[28px] border bg-white/88 shadow-[0_20px_44px_rgba(15,23,42,0.08)] transition-all duration-300 ${
                activeSurface === 1 ? "border-teal-100 ring-1 ring-teal-100/60" : "border-slate-200/80"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 sm:px-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Route board</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">A readable route with the next move in view</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Live-ready
                </span>
              </div>
              <div className="overflow-hidden bg-white px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
                <Image
                  src="/marketing/parqara-route-board-product.png"
                  alt="Parqara route planning workspace"
                  width={1536}
                  height={1024}
                  priority
                  className="h-auto w-full rounded-[22px] border border-slate-200/80"
                  sizes="(min-width: 1280px) 42vw, (min-width: 640px) 58vw, 92vw"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div
                data-testid="hero-shared-plan-card"
                className={`rounded-[24px] border bg-white/88 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.06)] transition-all duration-300 ${
                  activeSurface === 0 ? "border-teal-100 ring-1 ring-teal-100/60" : "border-slate-200/80"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Shared plan</p>
                <p className="mt-3 text-sm font-semibold text-slate-950">One saved plan for the group</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Destination, must-dos, pace, and food notes stay in one place before the route is built.
                </p>
              </div>

              <div
                data-testid="hero-status-card"
                className="rounded-[24px] border border-slate-200/80 bg-white/88 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.06)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Trip status</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <p className="text-sm font-semibold text-slate-950">{heroSurfaces[activeSurface].status}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 self-start">
            <div
              data-testid="hero-live-card"
              className={`overflow-hidden rounded-[24px] border bg-white/88 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-all duration-300 ${
                activeSurface === 2 ? "border-teal-100 ring-1 ring-teal-100/60" : "border-slate-200/80"
              }`}
            >
              <div className="border-b border-slate-200/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Live inbox</p>
              </div>
              <div className="overflow-hidden px-3 pb-3 pt-3">
                <Image
                  src="/marketing/parqara-live-inbox-product.png"
                  alt="Parqara live notification inbox"
                  width={1536}
                  height={1024}
                  className="h-auto w-full rounded-[20px] border border-slate-200/80"
                  sizes="(min-width: 1280px) 24vw, (min-width: 640px) 42vw, 92vw"
                />
              </div>
            </div>

            <div
              data-testid="hero-mara-panel"
              className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-center gap-3">
                <MaraPortrait size="sm" className="h-16 w-16 shrink-0 rounded-[20px]" />
                <div>
                  <div className="flex items-center gap-2 text-teal-700">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-sm font-semibold">Mara</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">Head planner agent</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {heroSurfaces.map((surface, index) => {
                  const isActive = index === activeSurface;

                  return (
                    <button
                      key={surface.action}
                      type="button"
                      onMouseEnter={() => setActiveSurface(index)}
                      className={`block w-full rounded-[16px] border px-3 py-2.5 text-left text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? "border-teal-100 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {surface.action}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function useRotatingIndex(length: number, intervalMs: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const rotateIndex = useEffectEvent(() => {
    setActiveIndex((current) => (current + 1) % length);
  });

  useEffect(() => {
    if (length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      rotateIndex();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, length]);

  return [activeIndex, setActiveIndex] as const;
}
