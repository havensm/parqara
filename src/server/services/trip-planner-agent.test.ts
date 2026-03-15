import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlannerContext } from "@/server/services/mara-agent-context";

const mockGetPlannerContext = vi.fn();
const mockBuildFallbackReply = vi.fn();
const mockRunMaraAgent = vi.fn();

vi.mock("@/server/services/mara-agent-context", () => ({
  getPlannerContext: (...args: unknown[]) => mockGetPlannerContext(...args),
}));

vi.mock("@/server/services/mara-agent-prompt", () => ({
  buildFallbackReply: (...args: unknown[]) => mockBuildFallbackReply(...args),
}));

vi.mock("@/server/services/mara-agent-sdk", () => ({
  runMaraAgent: (...args: unknown[]) => mockRunMaraAgent(...args),
}));

import { generateTripPlannerReply } from "@/server/services/trip-planner-agent";

const sampleContext: PlannerContext = {
  firstName: "Sam",
  summaryItems: ["Balanced plans"],
  planningPriorities: ["short-waits"],
  planningStyle: "Balanced",
  budgetPreference: "Moderate",
  travelDistancePreference: "Regional",
  planningHelpLevel: "A suggested itinerary",
  dietaryPreferences: [],
  accessibilityNeeds: [],
  additionalNotes: "",
  recentTrips: [],
  focusedTrip: null,
};

describe("generateTripPlannerReply", () => {
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    mockGetPlannerContext.mockResolvedValue(sampleContext);
    mockBuildFallbackReply.mockReturnValue("fallback reply");
  });

  afterEach(() => {
    vi.clearAllMocks();

    if (originalApiKey) {
      process.env.OPENAI_API_KEY = originalApiKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  });

  it("uses the deterministic fallback when no OpenAI key is configured", async () => {
    delete process.env.OPENAI_API_KEY;

    const reply = await generateTripPlannerReply("user-1", [{ role: "user", content: "Help me plan a trip." }], "trip-123");

    expect(reply).toBe("fallback reply");
    expect(mockRunMaraAgent).not.toHaveBeenCalled();
    expect(mockGetPlannerContext).toHaveBeenCalledWith("user-1", "trip-123");
    expect(mockBuildFallbackReply).toHaveBeenCalledWith(sampleContext, [{ role: "user", content: "Help me plan a trip." }]);
  });

  it("returns the SDK reply when the run succeeds", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockRunMaraAgent.mockResolvedValue("sdk reply");

    const reply = await generateTripPlannerReply("user-1", [{ role: "user", content: "Help me plan a trip." }], "trip-123");

    expect(reply).toBe("sdk reply");
    expect(mockGetPlannerContext).toHaveBeenCalledWith("user-1", "trip-123");
    expect(mockRunMaraAgent).toHaveBeenCalledWith(sampleContext, [{ role: "user", content: "Help me plan a trip." }]);
  });

  it("falls back when the SDK run fails", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockRunMaraAgent.mockRejectedValue(new Error("SDK failed"));

    const reply = await generateTripPlannerReply("user-1", [{ role: "user", content: "Help me plan a trip." }], "trip-123");

    expect(reply).toBe("fallback reply");
    expect(mockGetPlannerContext).toHaveBeenCalledWith("user-1", "trip-123");
    expect(mockBuildFallbackReply).toHaveBeenCalledWith(sampleContext, [{ role: "user", content: "Help me plan a trip." }]);
  });
});
