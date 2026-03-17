import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlannerContext } from "@/server/services/mara-agent-context";

const mockGetPlannerContext = vi.fn();
const mockBuildFallbackReply = vi.fn();
const mockRunMaraAgent = vi.fn();
const mockBuildTripLiveSnapshotProposalState = vi.fn();
const mockBuildTripPlannerInteractivePrompt = vi.fn();

vi.mock("@/server/services/mara-agent-context", () => ({
  getPlannerContext: (...args: unknown[]) => mockGetPlannerContext(...args),
}));

vi.mock("@/server/services/mara-agent-prompt", () => ({
  buildFallbackReply: (...args: unknown[]) => mockBuildFallbackReply(...args),
}));

vi.mock("@/server/services/mara-agent-sdk", () => ({
  runMaraAgent: (...args: unknown[]) => mockRunMaraAgent(...args),
}));

vi.mock("@/server/services/trip-live-snapshot-service", () => ({
  buildTripLiveSnapshotProposalState: (...args: unknown[]) => mockBuildTripLiveSnapshotProposalState(...args),
}));

vi.mock("@/server/services/trip-planner-interactive-prompt", () => ({
  buildTripPlannerInteractivePrompt: (...args: unknown[]) => mockBuildTripPlannerInteractivePrompt(...args),
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
  plannerAccessRole: "EDIT",
  logisticsScopedToViewer: false,
  logisticsRosterSummary: [],
  logisticsTaskSummary: [],
  viewerTaskSummary: [],
  recentTrips: [],
  focusedTrip: null,
};

describe("generateTripPlannerReply", () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const userMessages = [{ role: "user", content: "Help me plan a trip." }] as const;

  beforeEach(() => {
    mockGetPlannerContext.mockResolvedValue(sampleContext);
    mockBuildFallbackReply.mockReturnValue("fallback reply");
    mockBuildTripLiveSnapshotProposalState.mockResolvedValue(null);
    mockBuildTripPlannerInteractivePrompt.mockReturnValue(null);
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

    const result = await generateTripPlannerReply("user-1", [...userMessages], "trip-123");

    expect(result).toEqual({ reply: "fallback reply", snapshotProposal: null, interactivePrompt: null });
    expect(mockRunMaraAgent).not.toHaveBeenCalled();
    expect(mockGetPlannerContext).toHaveBeenCalledWith("user-1", "trip-123");
    expect(mockBuildFallbackReply).toHaveBeenCalledWith(sampleContext, [...userMessages]);
    expect(mockBuildTripLiveSnapshotProposalState).toHaveBeenCalledWith("user-1", "trip-123", [...userMessages], "fallback reply");
    expect(mockBuildTripPlannerInteractivePrompt).toHaveBeenCalledWith(sampleContext, [...userMessages]);
  });

  it("returns the SDK reply when the run succeeds", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockRunMaraAgent.mockResolvedValue("sdk reply");

    const result = await generateTripPlannerReply("user-1", [...userMessages], "trip-123");

    expect(result).toEqual({ reply: "sdk reply", snapshotProposal: null, interactivePrompt: null });
    expect(mockGetPlannerContext).toHaveBeenCalledWith("user-1", "trip-123");
    expect(mockRunMaraAgent).toHaveBeenCalledWith(sampleContext, [...userMessages]);
    expect(mockBuildTripLiveSnapshotProposalState).toHaveBeenCalledWith("user-1", "trip-123", [...userMessages], "sdk reply");
    expect(mockBuildTripPlannerInteractivePrompt).toHaveBeenCalledWith(sampleContext, [...userMessages]);
  });

  it("falls back when the SDK run fails", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockRunMaraAgent.mockRejectedValue(new Error("SDK failed"));

    const result = await generateTripPlannerReply("user-1", [...userMessages], "trip-123");

    expect(result).toEqual({ reply: "fallback reply", snapshotProposal: null, interactivePrompt: null });
    expect(mockGetPlannerContext).toHaveBeenCalledWith("user-1", "trip-123");
    expect(mockBuildFallbackReply).toHaveBeenCalledWith(sampleContext, [...userMessages]);
    expect(mockBuildTripLiveSnapshotProposalState).toHaveBeenCalledWith("user-1", "trip-123", [...userMessages], "fallback reply");
    expect(mockBuildTripPlannerInteractivePrompt).toHaveBeenCalledWith(sampleContext, [...userMessages]);
  });
});
