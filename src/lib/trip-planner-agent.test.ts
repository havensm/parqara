import { describe, expect, it } from "vitest";

import { tripPlannerChatRequestSchema } from "@/lib/trip-planner-agent";

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
