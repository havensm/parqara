import { addDays, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek } from "date-fns";

import type { TripStatusValue } from "@/lib/contracts";

export type CalendarTripItem = {
  id: string;
  name: string;
  parkName: string;
  status: TripStatusValue;
  visitDate: string;
  latestPlanSummary: string | null;
  href: string;
};

export type PersonalCalendarEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string | null;
  location: string | null;
};

export type CalendarDayEvent =
  | {
      kind: "trip";
      id: string;
      title: string;
      href: string;
      status: TripStatusValue;
      parkName: string;
      detail: string | null;
    }
  | {
      kind: "personal";
      id: string;
      title: string;
      location: string | null;
      detail: string | null;
    };

export type CalendarDay = {
  key: string;
  date: Date;
  dayNumber: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarDayEvent[];
  tripCount: number;
  personalCount: number;
};

function buildDateFromParts(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

export function parseCalendarDateKey(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, yearValue, monthValue, dayValue] = match;
  const date = buildDateFromParts(Number(yearValue), Number(monthValue), Number(dayValue));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function getCalendarMonthKey(date: Date) {
  return format(date, "yyyy-MM");
}

export function parseCalendarMonthKey(value?: string | null) {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return startOfMonth(new Date());
  }

  const [, yearValue, monthValue] = match;
  const date = buildDateFromParts(Number(yearValue), Number(monthValue), 1);
  return Number.isNaN(date.getTime()) ? startOfMonth(new Date()) : startOfMonth(date);
}

export function formatCalendarMonthLabel(date: Date) {
  return format(date, "MMMM yyyy");
}

export function formatCalendarDateLabel(value: string) {
  const date = parseCalendarDateKey(value);
  return date ? format(date, "EEE, MMM d") : value;
}

function eventSpansDate(event: PersonalCalendarEvent, dayKey: string) {
  const normalizedEndDate = event.endDate >= event.startDate ? event.endDate : event.startDate;
  return event.startDate <= dayKey && dayKey <= normalizedEndDate;
}

export function buildCalendarDays(
  month: Date,
  trips: CalendarTripItem[],
  personalEvents: PersonalCalendarEvent[],
  today: Date = new Date()
): CalendarDay[] {
  const visibleStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const visibleEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days: CalendarDay[] = [];

  for (let cursor = visibleStart; cursor <= visibleEnd; cursor = addDays(cursor, 1)) {
    const dayKey = format(cursor, "yyyy-MM-dd");
    const dayTrips = trips
      .filter((trip) => trip.visitDate === dayKey)
      .map<CalendarDayEvent>((trip) => ({
        kind: "trip",
        id: trip.id,
        title: trip.name,
        href: trip.href,
        status: trip.status,
        parkName: trip.parkName,
        detail: trip.latestPlanSummary,
      }));
    const dayPersonalEvents = personalEvents
      .filter((event) => eventSpansDate(event, dayKey))
      .map<CalendarDayEvent>((event) => ({
        kind: "personal",
        id: event.id,
        title: event.title,
        location: event.location,
        detail: event.description,
      }));

    days.push({
      key: dayKey,
      date: cursor,
      dayNumber: format(cursor, "d"),
      inCurrentMonth: getCalendarMonthKey(cursor) === getCalendarMonthKey(month),
      isToday: isSameDay(cursor, today),
      events: [...dayTrips, ...dayPersonalEvents],
      tripCount: dayTrips.length,
      personalCount: dayPersonalEvents.length,
    });
  }

  return days;
}

function decodeIcsText(value: string) {
  return value.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

function unfoldIcsLines(content: string) {
  const normalized = content.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];

  for (const line of normalized) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length) {
      lines[lines.length - 1] += line.slice(1);
      continue;
    }

    lines.push(line);
  }

  return lines;
}

type ParsedIcsDateValue = {
  dateKey: string;
  isDateOnly: boolean;
};

function parseIcsDateValue(rawKey: string, rawValue: string): ParsedIcsDateValue | null {
  const value = rawValue.trim();
  const upperKey = rawKey.toUpperCase();
  const isDateOnly = upperKey.includes("VALUE=DATE") || /^\d{8}$/.test(value);

  if (/^\d{8}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    return { dateKey: format(buildDateFromParts(year, month, day), "yyyy-MM-dd"), isDateOnly: true };
  }

  if (/^\d{8}T\d{6}Z$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    const hours = Number(value.slice(9, 11));
    const minutes = Number(value.slice(11, 13));
    const seconds = Number(value.slice(13, 15));
    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    return { dateKey: format(date, "yyyy-MM-dd"), isDateOnly };
  }

  if (/^\d{8}T\d{6}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    const hours = Number(value.slice(9, 11));
    const minutes = Number(value.slice(11, 13));
    const seconds = Number(value.slice(13, 15));
    const date = new Date(year, month - 1, day, hours, minutes, seconds);
    return { dateKey: format(date, "yyyy-MM-dd"), isDateOnly };
  }

  return null;
}

function buildPersonalCalendarEvent(values: Record<string, string>) {
  const startEntry = Object.entries(values).find(([key]) => key.startsWith("DTSTART"));
  if (!startEntry) {
    return null;
  }

  const startDate = parseIcsDateValue(startEntry[0], startEntry[1]);
  if (!startDate) {
    return null;
  }

  const endEntry = Object.entries(values).find(([key]) => key.startsWith("DTEND"));
  const rawEndDate = endEntry ? parseIcsDateValue(endEntry[0], endEntry[1]) : null;

  let endDate = startDate.dateKey;
  if (rawEndDate) {
    if (startDate.isDateOnly && rawEndDate.isDateOnly && rawEndDate.dateKey > startDate.dateKey) {
      const exclusiveEndDate = parseCalendarDateKey(rawEndDate.dateKey);
      if (exclusiveEndDate) {
        const inclusiveEndDate = addDays(exclusiveEndDate, -1);
        const normalizedInclusiveEnd = format(inclusiveEndDate, "yyyy-MM-dd");
        endDate = normalizedInclusiveEnd >= startDate.dateKey ? normalizedInclusiveEnd : startDate.dateKey;
      }
    } else {
      endDate = rawEndDate.dateKey >= startDate.dateKey ? rawEndDate.dateKey : startDate.dateKey;
    }
  }

  const title = decodeIcsText(values.SUMMARY ?? "Personal event").trim() || "Personal event";
  const id = decodeIcsText(values.UID ?? `${title}-${startDate.dateKey}`);

  return {
    id,
    title,
    startDate: startDate.dateKey,
    endDate,
    description: values.DESCRIPTION ? decodeIcsText(values.DESCRIPTION).trim() || null : null,
    location: values.LOCATION ? decodeIcsText(values.LOCATION).trim() || null : null,
  } satisfies PersonalCalendarEvent;
}

export function parseIcsFile(content: string): PersonalCalendarEvent[] {
  const lines = unfoldIcsLines(content);
  const events: PersonalCalendarEvent[] = [];
  let currentEvent: Record<string, string> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      currentEvent = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (currentEvent) {
        const event = buildPersonalCalendarEvent(currentEvent);
        if (event) {
          events.push(event);
        }
      }

      currentEvent = null;
      continue;
    }

    if (!currentEvent) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).toUpperCase();
    const value = line.slice(separatorIndex + 1);
    currentEvent[key] = value;
  }

  const seenIds = new Set<string>();
  return events.filter((event) => {
    if (seenIds.has(event.id)) {
      return false;
    }

    seenIds.add(event.id);
    return true;
  });
}
