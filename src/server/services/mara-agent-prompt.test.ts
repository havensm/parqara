import { describe, expect, it } from "vitest";

import type { PlannerContext } from "@/server/services/mara-agent-context";
import { buildFallbackReply, buildMaraInstructions } from "@/server/services/mara-agent-prompt";

const sampleContext: PlannerContext = {
  firstName: "Sam",
  summaryItems: ["Relaxed and flexible plans", "Food-first"],
  planningPriorities: ["short-waits", "food"],
  planningStyle: "Relaxed and flexible",
  budgetPreference: "Moderate",
  travelDistancePreference: "Local",
  planningHelpLevel: "A suggested itinerary",
  dietaryPreferences: ["gluten-free"],
  accessibilityNeeds: ["mobility-support"],
  additionalNotes: "Needs shade breaks in the afternoon.",
  recentTrips: [
    {
      name: "Holiday Weekend",
      parkName: "Aurora Adventure Park",
      status: "PLANNED",
      latestPlanSummary: "Lunch is anchored before the rush.",
    },
  ],
  focusedTrip: {
    name: "Spring Break",
    parkName: "Aurora Adventure Park",
    status: "LIVE",
    visitDate: "2026-04-01",
    latestPlanSummary: "Keep the morning calm and protect lunch.",
    partySize: 3,
    kidsAges: [8],
    thrillTolerance: "MEDIUM",
    walkingTolerance: "LOW",
    preferredRideTypes: ["dark-rides", "shows"],
    diningPreferences: ["quick-service"],
    startTime: "09:00",
    breakStart: "13:00",
    breakEnd: "14:00",
    itineraryPreview: ["River Run", "Lunch at Harbor Grill"],
    currentStep: 4,
  },
};

describe("buildMaraInstructions", () => {
  it("includes the persona rules and saved trip context for full mode", () => {
    const instructions = buildMaraInstructions(sampleContext);

    expect(instructions).toContain("You are Mara, Parqara's Trip Planning Concierge.");
    expect(instructions).toContain("Ask one question at a time when possible.");
    expect(instructions).toContain("Focused trip: Spring Break at Aurora Adventure Park on 2026-04-01 (Live)");
    expect(instructions).toContain("Focused trip itinerary preview: River Run -> Lunch at Harbor Grill");
    expect(instructions).toContain("Accessibility needs: mobility support");
  });

  it("switches to preview instructions for the Free plan preview mode", () => {
    const instructions = buildMaraInstructions(sampleContext, "preview");

    expect(instructions).toContain("This run is the Free plan preview.");
    expect(instructions).toContain("Starter recommendation, Rough budget range, Example day, Tailored suggestions, Next step");
    expect(instructions).toContain("Keep the whole reply under 180 words.");
  });
});

describe("buildFallbackReply", () => {
  it("returns the Free preview structure in preview mode", () => {
    const reply = buildFallbackReply(sampleContext, [{ role: "user", content: "Help me plan this trip." }], "preview");

    expect(reply).toContain("Starter recommendation");
    expect(reply).toContain("Rough budget range");
    expect(reply).toContain("Example day");
    expect(reply).toContain("Upgrade to Plus for unlimited Mara");
  });
});
