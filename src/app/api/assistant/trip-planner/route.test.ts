import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockApiError = vi.fn((error: unknown) =>
  NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
);
const mockRequireApiUser = vi.fn();
const mockGetUserBillingState = vi.fn();
const mockReserveMaraUsage = vi.fn();
const mockRollbackMaraUsageReservation = vi.fn();
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
  rollbackMaraUsageReservation: (...args: unknown[]) => mockRollbackMaraUsageReservation(...args),
}));

vi.mock("@/server/services/trip-planner-agent", () => ({
  generateTripPlannerReply: (...args: unknown[]) => mockGenerateTripPlannerReply(...args),
}));

import { POST } from "@/app/api/assistant/trip-planner/route";

describe("POST /api/assistant/trip-planner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the existing starter-preview envelope on success", async () => {
    mockRequireApiUser.mockResolvedValue({
      id: "user-1",
      subscriptionTier: "PLUS",
      subscriptionStatus: "ACTIVE",
    });
    mockGetUserBillingState
      .mockReturnValueOnce({
        currentTier: "PLUS",
        featureAccess: { aiConcierge: false },
        maraStarterPreview: { usedReplies: 1, remainingReplies: 2, replyLimit: 3 },
      })
      .mockReturnValueOnce({
        currentTier: "PLUS",
        featureAccess: { aiConcierge: false },
        maraStarterPreview: { usedReplies: 2, remainingReplies: 1, replyLimit: 3 },
      });
    mockReserveMaraUsage.mockResolvedValue({
      maraPreviewRepliesUsed: 2,
      hadStarterReplyReservation: true,
    });
    mockGenerateTripPlannerReply.mockResolvedValue("Here is the updated plan.");

    const response = await POST(
      new Request("http://localhost/api/assistant/trip-planner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Help me plan lunch." }],
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reply: "Here is the updated plan.",
      fullAccess: false,
      usedStarterReplies: 2,
      remainingStarterReplies: 1,
      starterReplyLimit: 3,
    });
    expect(mockRollbackMaraUsageReservation).not.toHaveBeenCalled();
  });

  it("rolls back the starter reservation when the AI reply fails", async () => {
    mockRequireApiUser.mockResolvedValue({
      id: "user-1",
      subscriptionTier: "PLUS",
      subscriptionStatus: "ACTIVE",
    });
    mockGetUserBillingState.mockReturnValue({
      currentTier: "PLUS",
      featureAccess: { aiConcierge: false },
      maraStarterPreview: { usedReplies: 1, remainingReplies: 2, replyLimit: 3 },
    });
    mockReserveMaraUsage.mockResolvedValue({
      maraPreviewRepliesUsed: 2,
      hadStarterReplyReservation: true,
    });
    mockGenerateTripPlannerReply.mockRejectedValue(new Error("AI failed"));

    const response = await POST(
      new Request("http://localhost/api/assistant/trip-planner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Help me plan lunch." }],
        }),
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "AI failed" });
    expect(mockRollbackMaraUsageReservation).toHaveBeenCalledWith({
      userId: "user-1",
      hadStarterReplyReservation: true,
    });
  });
});
