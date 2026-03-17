import { describe, expect, it } from "vitest";

import type { PlannerContext } from "@/server/services/mara-agent-context";
import { buildTripPlannerInteractivePrompt } from "@/server/services/trip-planner-interactive-prompt";

const starterContext: PlannerContext = {
  firstName: "Sam",
  summaryItems: [],
  planningPriorities: [],
  planningStyle: "Balanced",
  budgetPreference: "Moderate",
  travelDistancePreference: "Regional",
  planningHelpLevel: "A suggested itinerary",
  dietaryPreferences: [],
  accessibilityNeeds: [],
  additionalNotes: "",
  plannerAccessRole: "EDIT",
  logisticsScopedToViewer: false,
  logisticsRosterSummary: [],
  logisticsTaskSummary: [],
  viewerTaskSummary: [],
  recentTrips: [],
  focusedTrip: {
    name: "Trip planner",
    parkName: "Aurora Adventure Park",
    status: "DRAFT",
    visitDate: "Mar 20",
    latestPlanSummary: null,
    startingLocation: null,
    partySize: 1,
    kidsAges: [],
    thrillTolerance: "MEDIUM",
    walkingTolerance: "MEDIUM",
    preferredRideTypes: [],
    diningPreferences: [],
    startTime: "09:00",
    breakStart: null,
    breakEnd: null,
    itineraryPreview: [],
    currentStep: 0,
  },
};

describe("buildTripPlannerInteractivePrompt", () => {
  it("asks about travel scope for a generic outing idea", () => {
    const prompt = buildTripPlannerInteractivePrompt(starterContext, [{ role: "user", content: "I want to go to the zoo." }]);

    expect(prompt?.id).toBe("travel-scope");
    expect(prompt?.prompt).toContain("close to home");
  });

  it("treats close by as a valid travel scope answer and moves to timing", () => {
    const prompt = buildTripPlannerInteractivePrompt(starterContext, [
      { role: "user", content: "I want to go to the zoo." },
      { role: "user", content: "close by" },
    ]);

    expect(prompt?.id).toBe("timing");
  });

  it("asks for a starting location once the basics are mostly known", () => {
    const prompt = buildTripPlannerInteractivePrompt(starterContext, [
      { role: "user", content: "I want to go to a zoo close to home this weekend with my family." },
    ]);

    expect(prompt?.id).toBe("starting-location");
    expect(prompt?.kind).toBe("ADDRESS");
  });
});
