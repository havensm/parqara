import { describe, expect, it } from "vitest";

import {
  buildTripPlannerNeededQuestions,
  buildTripPlannerTripContext,
  buildTripPlannerWelcomeMessage,
  getTripPlannerStarterPrompts,
  tripPlannerChatRequestSchema,
} from "@/lib/trip-planner-agent";

describe("tripPlannerChatRequestSchema", () => {
  it("accepts a normal Mara conversation payload when a planner is attached", () => {
    const result = tripPlannerChatRequestSchema.safeParse({
      tripId: "trip-123",
      messages: [
        { role: "assistant", content: "How can I help plan this?" },
        { role: "user", content: "Plan a Saturday zoo trip for two adults and a child." },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects requests without a planner id", () => {
    const result = tripPlannerChatRequestSchema.safeParse({
      messages: [{ role: "user", content: "Help me plan a trip." }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects oversized combined prompts", () => {
    const result = tripPlannerChatRequestSchema.safeParse({
      tripId: "trip-123",
      messages: [
        { role: "assistant", content: "a".repeat(1_000) },
        { role: "user", content: "b".repeat(1_000) },
        { role: "assistant", content: "c".repeat(1_000) },
        { role: "user", content: "d".repeat(1_000) },
        { role: "assistant", content: "e".repeat(1_000) },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes("4,000 characters"))).toBe(true);
  });
});

describe("starter planner copy", () => {
  it("uses a simple kickoff welcome message", () => {
    expect(
      buildTripPlannerWelcomeMessage(
        "Test",
        {
          id: "trip-123",
          name: "Trip planner",
          parkName: "Aurora Adventure Park",
          startingLocation: null,
          status: "DRAFT",
          visitDate: "Mar 21",
          summary: null,
          detailTags: [],
        },
        true
      )
    ).toBe("Hi Test. What do you want to plan?");
  });

  it("uses kickoff prompts for the default planner", () => {
    expect(getTripPlannerStarterPrompts(undefined, true)).toEqual([
      "Plan a weekend trip.",
      "Plan a night out.",
      "Plan a family day.",
      "Plan a park day.",
    ]);
  });
});


describe("starting location planner context", () => {
  it("includes the saved starting location in trip context and welcome copy", () => {
    const context = buildTripPlannerTripContext({
      id: "trip-123",
      name: "Zoo Saturday",
      status: "DRAFT",
      startingLocation: "Battery Park City, New York, NY",
      visitDate: "2026-04-03",
      latestPlanSummary: null,
      park: {
        id: "park-123",
        slug: "central-zoo",
        name: "Central Zoo",
        resort: "City Adventures",
        description: null,
        opensAt: "09:00",
        closesAt: "18:00",
      },
      partyProfile: {
        partySize: 3,
        kidsAges: [6],
        thrillTolerance: "LOW",
        walkingTolerance: "MEDIUM",
        preferredRideTypes: [],
        mustDoRideIds: [],
        diningPreferences: [],
        startTime: "09:30",
        breakStart: null,
        breakEnd: null,
      },
      itinerary: [],
    });

    expect(context.detailTags).toContain("Start Battery Park City, New York, NY");
    expect(buildTripPlannerWelcomeMessage("Test", context, false)).toContain("Start Battery Park City, New York, NY");
  });

  it("asks for a starting location when one is still missing", () => {
    expect(
      buildTripPlannerNeededQuestions({
        status: "DRAFT",
        name: "Zoo Saturday",
        startingLocation: null,
        park: {
          id: "park-123",
          slug: "central-zoo",
          name: "Central Zoo",
          resort: "City Adventures",
          description: null,
          opensAt: "09:00",
          closesAt: "18:00",
        },
        partyProfile: {
          partySize: 3,
          kidsAges: [6],
          thrillTolerance: "LOW",
          walkingTolerance: "MEDIUM",
          preferredRideTypes: [],
          mustDoRideIds: [],
          diningPreferences: [],
          startTime: "09:30",
          breakStart: null,
          breakEnd: null,
        },
        itinerary: [],
      })
    ).toContain("Where are you starting from?");
  });
});
