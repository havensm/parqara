import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApiError = vi.fn((error: unknown) =>
  NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
);
const mockRequireApiUser = vi.fn();
const mockGetUserBillingState = vi.fn();
const mockReserveMaraUsage = vi.fn();
const mockGenerateTripPlannerReply = vi.fn();

vi.mock("@/app/api/_utils", () => ({
  apiError: (...args: unknown[]) => mockApiError(...args),
  requireApiUser: (...args: unknown[]) => mockRequireApiUser(...args),
}));

vi.mock("@/lib/billing", () => ({
  getUserBillingState: (...args: unknown[]) => mockGetUserBillingState(...args),
}));

vi.mock("@/server/services/mara-rate-limit-service", () => ({
  reserveMaraUsage: (...args: unknown[]) => mockReserveMaraUsage(...args),
}));

vi.mock("@/server/services/trip-planner-agent", () => ({
  generateTripPlannerReply: (...args: unknown[]) => mockGenerateTripPlannerReply(...args),
}));

import { POST } from "@/app/api/assistant/trip-planner/route";

describe("POST /api/assistant/trip-planner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the full-access envelope for Free users", async () => {
    mockRequireApiUser.mockResolvedValue({
      id: "user-1",
      subscriptionTier: "FREE",
      subscriptionStatus: "INACTIVE",
    });
    mockGetUserBillingState.mockReturnValue({
      currentTier: "FREE",
      featureAccess: { aiConcierge: true },
      maraStarterPreview: { usedReplies: 0, remainingReplies: 0, replyLimit: 1 },
    });
    mockReserveMaraUsage.mockResolvedValue(undefined);
    mockGenerateTripPlannerReply.mockResolvedValue("Full planning reply.");

    const response = await POST(
      new Request("http://localhost/api/assistant/trip-planner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Help me plan lunch." }],
          tripId: "trip-1",
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reply: "Full planning reply.",
      fullAccess: true,
    });
    expect(mockGenerateTripPlannerReply).toHaveBeenCalledWith("user-1", [{ role: "user", content: "Help me plan lunch." }], "trip-1");
  });

  it("returns the full-access envelope for paid Mara plans", async () => {
    mockRequireApiUser.mockResolvedValue({
      id: "user-1",
      subscriptionTier: "PLUS",
      subscriptionStatus: "ACTIVE",
    });
    mockGetUserBillingState.mockReturnValue({
      currentTier: "PLUS",
      featureAccess: { aiConcierge: true },
      maraStarterPreview: { usedReplies: 0, remainingReplies: 0, replyLimit: 1 },
    });
    mockReserveMaraUsage.mockResolvedValue(undefined);
    mockGenerateTripPlannerReply.mockResolvedValue("Full planning reply.");

    const response = await POST(
      new Request("http://localhost/api/assistant/trip-planner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Build me a full plan." }],
          tripId: "trip-1",
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reply: "Full planning reply.",
      fullAccess: true,
    });
    expect(mockGenerateTripPlannerReply).toHaveBeenCalledWith("user-1", [{ role: "user", content: "Build me a full plan." }], "trip-1");
  });

  it("returns the API error when the full Mara reply fails", async () => {
    mockRequireApiUser.mockResolvedValue({
      id: "user-1",
      subscriptionTier: "FREE",
      subscriptionStatus: "INACTIVE",
    });
    mockGetUserBillingState.mockReturnValue({
      currentTier: "FREE",
      featureAccess: { aiConcierge: true },
      maraStarterPreview: { usedReplies: 0, remainingReplies: 0, replyLimit: 1 },
    });
    mockReserveMaraUsage.mockResolvedValue(undefined);
    mockGenerateTripPlannerReply.mockRejectedValue(new Error("AI failed"));

    const response = await POST(
      new Request("http://localhost/api/assistant/trip-planner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Help me plan lunch." }],
          tripId: "trip-1",
        }),
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "AI failed" });
  });
});
