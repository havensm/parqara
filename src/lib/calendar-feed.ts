import { createHmac } from "node:crypto";

import { addDays, format } from "date-fns";

import type { CalendarTripItem } from "@/lib/calendar";
import { formatTripPlannerStatusLabel } from "@/lib/trip-planner-agent";

function normalizeOrigin(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized.replace(/\/$/, "") : null;
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function getCalendarFeedSecret() {
  return process.env.SESSION_SECRET?.trim() || "parqara-calendar-feed-secret";
}

function formatUtcIcsTimestamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function getCalendarAppOrigin() {
  return normalizeOrigin(process.env.APP_URL) ?? normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000";
}

export function buildCalendarFeedToken(userId: string) {
  return createHmac("sha256", getCalendarFeedSecret()).update(userId).digest("hex");
}

export function verifyCalendarFeedToken(userId: string, token: string) {
  return buildCalendarFeedToken(userId) === token;
}

export function buildCalendarFeedUrl(userId: string) {
  const url = new URL("/api/calendar/feed", getCalendarAppOrigin());
  url.searchParams.set("user", userId);
  url.searchParams.set("token", buildCalendarFeedToken(userId));
  return url.toString();
}

export function buildCalendarSubscriptionUrl(userId: string) {
  return buildCalendarFeedUrl(userId).replace(/^http/i, "webcal");
}

export function buildTripsCalendarIcs(trips: CalendarTripItem[]) {
  const origin = getCalendarAppOrigin();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Parqara//Trip Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Parqara Trips",
    "X-WR-CALDESC:Upcoming Parqara trip plans and statuses.",
  ];

  for (const trip of trips) {
    const startDate = trip.visitDate.replace(/-/g, "");
    const endDate = format(addDays(new Date(`${trip.visitDate}T12:00:00`), 1), "yyyyMMdd");
    const plannerUrl = `${origin}${trip.href}`;
    const summary = `${trip.name} (${formatTripPlannerStatusLabel(trip.status)})`;
    const description = [
      `Park: ${trip.parkName}`,
      `Status: ${formatTripPlannerStatusLabel(trip.status)}`,
      trip.latestPlanSummary ?? "Open Parqara to keep shaping the plan.",
      `Planner: ${plannerUrl}`,
    ].join("\n");

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${escapeIcsText(`${trip.id}@parqara.com`)}`);
    lines.push(`DTSTAMP:${formatUtcIcsTimestamp(new Date())}`);
    lines.push(`DTSTART;VALUE=DATE:${startDate}`);
    lines.push(`DTEND;VALUE=DATE:${endDate}`);
    lines.push(`SUMMARY:${escapeIcsText(summary)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
    lines.push(`URL:${escapeIcsText(plannerUrl)}`);
    lines.push("STATUS:CONFIRMED");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
