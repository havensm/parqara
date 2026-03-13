"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CalendarSync,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Import,
  Link2,
  Trash2,
} from "lucide-react";

import {
  buildCalendarDays,
  formatCalendarDateLabel,
  formatCalendarMonthLabel,
  getCalendarMonthKey,
  parseCalendarMonthKey,
  parseIcsFile,
  type CalendarTripItem,
  type PersonalCalendarEvent,
} from "@/lib/calendar";
import { formatTripPlannerStatusLabel } from "@/lib/trip-planner-agent";
import { cn } from "@/lib/utils";

import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PERSONAL_CALENDAR_STORAGE_KEY = "parqara.personal-calendar-sync";

const statusClassNames = {
  DRAFT: "border-amber-200 bg-amber-50 text-amber-700",
  PLANNED: "border-teal-200 bg-teal-50 text-teal-700",
  LIVE: "border-cyan-200 bg-cyan-50 text-cyan-700",
  COMPLETED: "border-slate-200 bg-slate-100 text-slate-600",
} as const;

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type StoredPersonalCalendarState = {
  events: PersonalCalendarEvent[];
  sourceName: string;
  syncedAt: string;
};

type CalendarWorkspaceProps = {
  trips: CalendarTripItem[];
  initialMonthKey: string;
  feedUrl: string;
  subscriptionUrl: string;
};

function shiftMonth(base: Date, monthOffset: number) {
  return new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
}

function formatSyncTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function readStoredPersonalCalendar() {
  const storedValue = window.localStorage.getItem(PERSONAL_CALENDAR_STORAGE_KEY);
  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as StoredPersonalCalendarState;
    if (Array.isArray(parsedValue.events) && typeof parsedValue.syncedAt === "string" && typeof parsedValue.sourceName === "string") {
      return parsedValue;
    }
  } catch {
    window.localStorage.removeItem(PERSONAL_CALENDAR_STORAGE_KEY);
  }

  return null;
}

export function CalendarWorkspace({ trips, initialMonthKey, feedUrl, subscriptionUrl }: CalendarWorkspaceProps) {
  const [month, setMonth] = useState(() => parseCalendarMonthKey(initialMonthKey));
  const [personalCalendar, setPersonalCalendar] = useState<StoredPersonalCalendarState | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const nextState = readStoredPersonalCalendar();
    if (!nextState) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => setPersonalCalendar(nextState));
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!copyMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopyMessage(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [copyMessage]);

  const calendarDays = buildCalendarDays(month, trips, personalCalendar?.events ?? []);
  const upcomingTrips = [...trips].sort((left, right) => left.visitDate.localeCompare(right.visitDate));
  const selectedMonthKey = getCalendarMonthKey(month);
  const selectedMonthTrips = upcomingTrips.filter((trip) => trip.visitDate.startsWith(selectedMonthKey));

  async function handleCopy(value: string) {
    if (!navigator.clipboard) {
      setCopyMessage("Copy unavailable");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage("Copied");
    } catch {
      setCopyMessage("Copy failed");
    }
  }

  async function handleCalendarImport(file: File) {
    const fileText = await file.text();
    const events = parseIcsFile(fileText);

    if (!events.length) {
      setSyncError("That file did not contain any readable calendar events.");
      return;
    }

    const nextState = {
      events,
      sourceName: file.name,
      syncedAt: new Date().toISOString(),
    } satisfies StoredPersonalCalendarState;

    window.localStorage.setItem(PERSONAL_CALENDAR_STORAGE_KEY, JSON.stringify(nextState));
    setPersonalCalendar(nextState);
    setSyncError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearImportedCalendar() {
    window.localStorage.removeItem(PERSONAL_CALENDAR_STORAGE_KEY);
    setPersonalCalendar(null);
    setSyncError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
      <Card className="p-0">
        <div className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_26%),linear-gradient(180deg,rgba(248,252,255,0.98),rgba(255,255,255,0.98))] px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Calendar view</p>
              <h2 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
                {formatCalendarMonthLabel(month)}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Trips stay clickable from the calendar so you can jump straight back into the planner.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => setMonth((currentMonth) => shiftMonth(currentMonth, -1))}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button type="button" variant="secondary" onClick={() => setMonth(parseCalendarMonthKey(initialMonthKey))}>
                Today
              </Button>
              <Button type="button" variant="secondary" onClick={() => setMonth((currentMonth) => shiftMonth(currentMonth, 1))}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">Draft</span>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-teal-700">Planned</span>
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-cyan-700">Live</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600">Personal calendar</span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="hidden grid-cols-7 gap-2 sm:grid">
            {weekdayLabels.map((label) => (
              <div key={label} className="px-2 py-1 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {label}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-7">
            {calendarDays.map((day) => {
              const visibleEvents = day.events.slice(0, 3);
              const hiddenCount = day.events.length - visibleEvents.length;

              return (
                <div
                  key={day.key}
                  className={cn(
                    "min-h-[168px] rounded-[24px] border p-3 transition sm:min-h-[186px]",
                    day.inCurrentMonth ? "border-slate-200 bg-white" : "border-slate-200/70 bg-slate-50/80",
                    day.isToday && "border-teal-300 shadow-[0_14px_30px_rgba(13,148,136,0.12)]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          day.inCurrentMonth ? "text-slate-900" : "text-slate-400",
                          day.isToday && "text-teal-700"
                        )}
                      >
                        {day.dayNumber}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">{formatCalendarDateLabel(day.key)}</p>
                    </div>
                    {day.tripCount ? (
                      <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-700">
                        {day.tripCount} trip{day.tripCount === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-2">
                    {visibleEvents.map((event) =>
                      event.kind === "trip" ? (
                        <Link
                          key={event.id}
                          href={event.href}
                          className="block rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfb_100%)] px-3 py-2 transition hover:border-[#bfd4cb] hover:shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="line-clamp-1 text-sm font-semibold text-slate-950">{event.title}</p>
                            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]", statusClassNames[event.status])}>
                              {formatTripPlannerStatusLabel(event.status)}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{event.parkName}</p>
                        </Link>
                      ) : (
                        <div key={event.id} className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="line-clamp-1 text-sm font-medium text-slate-700">{event.title}</p>
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{event.location ?? "Personal calendar"}</p>
                        </div>
                      )
                    )}

                    {hiddenCount > 0 ? <p className="px-1 text-xs font-medium text-slate-500">+{hiddenCount} more</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-0">
          <div className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_26%),linear-gradient(180deg,rgba(247,250,255,0.98),rgba(255,255,255,0.98))] px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-sky-100 text-sky-700">
                <CalendarSync className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-700/70">Sync</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Personal calendar</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Import an <code>.ics</code> file from Google, Apple Calendar, or Outlook to layer your outside plans into Parqara. You can also subscribe your personal calendar to the Parqara trip feed.
            </p>
          </div>

          <div className="space-y-4 p-6">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-semibold text-slate-950">Import personal calendar</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Bring your own events into this calendar view without leaving the planner.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <label className={cn(buttonStyles({ variant: "secondary", size: "default" }), "cursor-pointer")}>
                  <Import className="mr-2 h-4 w-4" />
                  Import .ics file
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ics,text/calendar"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleCalendarImport(file);
                      }
                    }}
                  />
                </label>

                {personalCalendar ? (
                  <Button type="button" variant="ghost" onClick={clearImportedCalendar}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear imported events
                  </Button>
                ) : null}
              </div>

              {personalCalendar ? (
                <div className="mt-4 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-950">{personalCalendar.events.length} personal event{personalCalendar.events.length === 1 ? "" : "s"} synced</p>
                  <p className="mt-1">Source: {personalCalendar.sourceName}</p>
                  <p className="mt-1">Last synced: {formatSyncTimestamp(personalCalendar.syncedAt)}</p>
                </div>
              ) : (
                <div className="mt-4 rounded-[18px] border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
                  No personal calendar imported yet.
                </div>
              )}

              {syncError ? <p className="mt-3 text-sm text-rose-600">{syncError}</p> : null}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">Subscribe your calendar app to Parqara</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Use this private feed URL in Apple Calendar, Google Calendar, or Outlook to keep upcoming trips synced outside the app.</p>
              <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Private feed URL</p>
                <input
                  readOnly
                  value={feedUrl}
                  className="mt-2 w-full border-0 bg-transparent p-0 text-sm text-slate-700 outline-none"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={() => void handleCopy(feedUrl)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy feed URL
                </Button>
                <a href={subscriptionUrl} className={buttonStyles({ variant: "ghost", size: "default" })}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Open subscribe link
                </a>
                <a href={feedUrl} target="_blank" rel="noreferrer" className={buttonStyles({ variant: "ghost", size: "default" })}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview feed
                </a>
              </div>
              {copyMessage ? <p className="mt-3 text-sm text-teal-700">{copyMessage}</p> : null}
            </div>
          </div>
        </Card>

        <Card className="p-0">
          <div className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_24%),linear-gradient(180deg,rgba(244,252,250,0.98),rgba(255,255,255,0.98))] px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Upcoming trips</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">What is coming up next</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Every trip here opens the existing planner workspace, so the calendar becomes another front door into the same trip tab.
            </p>
          </div>
          <div className="space-y-3 p-6">
            {upcomingTrips.length ? (
              upcomingTrips.map((trip) => (
                <Link
                  key={trip.id}
                  href={trip.href}
                  className="block rounded-[24px] border border-slate-200 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-[#bfd4cb] hover:shadow-[0_16px_28px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{trip.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{trip.parkName}</p>
                    </div>
                    <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]", statusClassNames[trip.status])}>
                      {formatTripPlannerStatusLabel(trip.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{formatCalendarDateLabel(trip.visitDate)}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{trip.latestPlanSummary ?? "Open the planner to keep shaping the route."}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                No upcoming trips yet. Start a new trip and it will land on this calendar automatically.
              </div>
            )}

            {selectedMonthTrips.length ? (
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                {selectedMonthTrips.length} trip{selectedMonthTrips.length === 1 ? "" : "s"} in {formatCalendarMonthLabel(month)}.
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
