import { afterEach, describe, expect, it } from "vitest";

import { buildCalendarFeedToken, buildCalendarFeedUrl, buildTripsCalendarIcs, verifyCalendarFeedToken } from "@/lib/calendar-feed";

const originalAppUrl = process.env.APP_URL;
const originalPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const originalSessionSecret = process.env.SESSION_SECRET;

afterEach(() => {
  process.env.APP_URL = originalAppUrl;
  process.env.NEXT_PUBLIC_APP_URL = originalPublicAppUrl;
  process.env.SESSION_SECRET = originalSessionSecret;
});

describe("calendar feed helpers", () => {
  it("builds a stable signed feed url", () => {
    process.env.APP_URL = "https://parqara.com";
    process.env.SESSION_SECRET = "secret-value";

    const url = buildCalendarFeedUrl("user-1");
    const token = buildCalendarFeedToken("user-1");

    expect(url).toContain("https://parqara.com/api/calendar/feed");
    expect(url).toContain(`user=user-1`);
    expect(url).toContain(`token=${token}`);
    expect(verifyCalendarFeedToken("user-1", token)).toBe(true);
    expect(verifyCalendarFeedToken("user-1", "wrong-token")).toBe(false);
  });

  it("serializes trips to a valid ics body", () => {
    process.env.APP_URL = "https://parqara.com";

    const body = buildTripsCalendarIcs([
      {
        id: "trip-1",
        name: "Spring Break",
        parkName: "Aurora Adventure Park",
        status: "PLANNED",
        visitDate: "2026-03-14",
        latestPlanSummary: "Lunch stays protected.",
        href: "/trips/trip-1",
      },
    ]);

    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("SUMMARY:Spring Break (Planned)");
    expect(body).toContain("DTSTART;VALUE=DATE:20260314");
    expect(body).toContain("URL:https://parqara.com/trips/trip-1");
    expect(body).toContain("END:VCALENDAR");
  });
});
