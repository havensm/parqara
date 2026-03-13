import { describe, expect, it } from "vitest";

import { buildCalendarDays, parseIcsFile } from "@/lib/calendar";

describe("buildCalendarDays", () => {
  it("combines trip and personal events into the correct day cell", () => {
    const days = buildCalendarDays(
      new Date(2026, 2, 1),
      [
        {
          id: "trip-1",
          name: "Spring Break",
          parkName: "Aurora Adventure Park",
          status: "PLANNED",
          visitDate: "2026-03-14",
          latestPlanSummary: "Lunch stays protected.",
          href: "/trips/trip-1",
        },
      ],
      [
        {
          id: "event-1",
          title: "School recital",
          startDate: "2026-03-14",
          endDate: "2026-03-14",
          description: null,
          location: "Main hall",
        },
      ],
      new Date(2026, 2, 14)
    );

    const matchingDay = days.find((day) => day.key === "2026-03-14");

    expect(matchingDay).toMatchObject({
      tripCount: 1,
      personalCount: 1,
      isToday: true,
    });
    expect(matchingDay?.events[0]).toMatchObject({
      kind: "trip",
      title: "Spring Break",
    });
    expect(matchingDay?.events[1]).toMatchObject({
      kind: "personal",
      title: "School recital",
    });
  });
});

describe("parseIcsFile", () => {
  it("parses date-only and timed events from an ics file", () => {
    const events = parseIcsFile(`BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:all-day\nSUMMARY:Park Day\nDTSTART;VALUE=DATE:20260314\nDTEND;VALUE=DATE:20260315\nDESCRIPTION:Lunch\\nBreak\nEND:VEVENT\nBEGIN:VEVENT\nUID:timed\nSUMMARY:Flight Home\nDTSTART:20260316T180000Z\nDTEND:20260316T220000Z\nLOCATION:MCO\nEND:VEVENT\nEND:VCALENDAR`);

    expect(events).toEqual([
      {
        id: "all-day",
        title: "Park Day",
        startDate: "2026-03-14",
        endDate: "2026-03-14",
        description: "Lunch\nBreak",
        location: null,
      },
      {
        id: "timed",
        title: "Flight Home",
        startDate: "2026-03-16",
        endDate: "2026-03-16",
        description: null,
        location: "MCO",
      },
    ]);
  });
});
