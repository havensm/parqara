"use client";

import type { ReactNode } from "react";
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
import { Dialog } from "@/components/ui/dialog";

const PERSONAL_CALENDAR_STORAGE_KEY = "parqara.personal-calendar-sync";

const statusBadgeClassNames = {
  DRAFT: "text-amber-700",
  PLANNED: "text-teal-700",
  LIVE: "text-cyan-700",
  COMPLETED: "text-slate-600",
} as const;

const statusDotClassNames = {
  DRAFT: "bg-amber-400",
  PLANNED: "bg-teal-400",
  LIVE: "bg-cyan-400",
  COMPLETED: "bg-slate-400",
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
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
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
  const personalCalendarSummary = personalCalendar
    ? `${personalCalendar.events.length} personal event${personalCalendar.events.length === 1 ? "" : "s"} synced`
    : "No personal calendar imported yet";

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
    <>
      <div className="space-y-6">
        <Card tone="solid" className="p-0">
          <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-6 py-6 sm:px-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Calendar view</p>
                <h2 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
                  {formatCalendarMonthLabel(month)}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Trips stay clickable from the calendar so you can jump straight back into the planner. Personal sync tools stay tucked into one dialog.
                </p>
              </div>

              <div className="flex flex-col gap-3 xl:items-end">
                <div className="flex flex-wrap gap-3 xl:justify-end">
                  <Button type="button" onClick={() => setIsSyncDialogOpen(true)}>
                    <CalendarSync className="mr-2 h-4 w-4" />
                    Calendar sync
                  </Button>
                  <div className="flex items-center rounded-[18px] border border-slate-200 bg-white p-1 shadow-[0_10px_24px_rgba(12,20,37,0.04)]">
                    <MonthNavButton onClick={() => setMonth((currentMonth) => shiftMonth(currentMonth, -1))}>
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </MonthNavButton>
                    <MonthNavButton onClick={() => setMonth(parseCalendarMonthKey(initialMonthKey))} active>
                      Today
                    </MonthNavButton>
                    <MonthNavButton onClick={() => setMonth((currentMonth) => shiftMonth(currentMonth, 1))}>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </MonthNavButton>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500 xl:justify-end">
                  <LegendKey label="Draft" tone="DRAFT" />
                  <LegendKey label="Planned" tone="PLANNED" />
                  <LegendKey label="Live" tone="LIVE" />
                  <LegendPlain label="Personal calendar" />
                </div>
                <p className="text-sm text-slate-500 xl:text-right">{personalCalendarSummary}</p>
              </div>
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
                      "min-h-[168px] rounded-[24px] border p-3 transition sm:min-h-[186px] xl:min-h-[198px]",
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
                      {day.tripCount ? <span className="text-xs font-medium text-slate-500">{day.tripCount} trip{day.tripCount === 1 ? "" : "s"}</span> : null}
                    </div>

                    <div className="mt-3 space-y-2">
                      {visibleEvents.map((event) =>
                        event.kind === "trip" ? (
                          <Link
                            key={event.id}
                            href={event.href}
                            className="block rounded-[18px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfb_100%)] px-3 py-2 transition hover:border-[#bfd4cb] hover:shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="line-clamp-2 text-sm font-semibold text-slate-950">{event.title}</p>
                              <StatusInline status={event.status} />
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

          <div className="flex flex-col gap-1 border-t border-slate-200/80 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>{selectedMonthTrips.length} trip{selectedMonthTrips.length === 1 ? "" : "s"} in {formatCalendarMonthLabel(month)}.</p>
            <p>{personalCalendarSummary}</p>
          </div>
        </Card>

        <Card tone="solid" className="p-0">
          <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,#f8fcfb_0%,#ffffff_100%)] px-6 py-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Upcoming trips</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">What is coming up next</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                  Every trip here opens the existing planner workspace, so the calendar becomes another front door into the same trip tab.
                </p>
              </div>
              <p className="text-sm text-slate-500">{selectedMonthTrips.length} in {formatCalendarMonthLabel(month)}</p>
            </div>
          </div>
          <div className="p-6">
            {upcomingTrips.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {upcomingTrips.map((trip) => (
                  <Link
                    key={trip.id}
                    href={trip.href}
                    className="block rounded-[24px] border border-slate-200 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-[#bfd4cb] hover:shadow-[0_16px_28px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-950">{trip.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{trip.parkName}</p>
                      </div>
                      <StatusInline status={trip.status} />
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{formatCalendarDateLabel(trip.visitDate)}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{trip.latestPlanSummary ?? "Open the planner to keep shaping the route."}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                No upcoming trips yet. Start a new trip and it will land on this calendar automatically.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog
        open={isSyncDialogOpen}
        title="Calendar sync"
        description="Import an .ics file from Google, Apple Calendar, or Outlook, or subscribe your calendar app to Parqara's private trip feed."
        onClose={() => setIsSyncDialogOpen(false)}
        className="max-w-3xl"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
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

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
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
      </Dialog>
    </>
  );
}

function MonthNavButton({
  children,
  onClick,
  active = false,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-[14px] px-4 text-sm font-medium transition",
        active ? "bg-[var(--surface-muted)] text-[var(--foreground)]" : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
      )}
    >
      {children}
    </button>
  );
}

function LegendKey({ label, tone }: { label: string; tone: keyof typeof statusDotClassNames }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", statusDotClassNames[tone])} />
      <span>{label}</span>
    </span>
  );
}

function LegendPlain({ label }: { label: string }) {
  return <span className="inline-flex items-center gap-2">{label}</span>;
}

function StatusInline({ status }: { status: keyof typeof statusDotClassNames }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]", statusBadgeClassNames[status])}>
      <span className={cn("h-2 w-2 rounded-full", statusDotClassNames[status])} />
      {formatTripPlannerStatusLabel(status)}
    </span>
  );
}
