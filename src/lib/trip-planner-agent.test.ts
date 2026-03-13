import { describe, expect, it } from "vitest";

import { tripPlannerChatRequestSchema } from "@/lib/trip-planner-agent";

describe("tripPlannerChatRequestSchema", () => {
  it("accepts a normal Mara conversation payload", () => {
    const result = tripPlannerChatRequestSchema.safeParse({
      messages: [
        { role: "assistant", content: "How can I help plan this?" },
        { role: "user", content: "Plan a Saturday zoo trip for two adults and a child." },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects oversized combined prompts", () => {
    const result = tripPlannerChatRequestSchema.safeParse({
      messages: [
        { role: "assistant", content: "a".repeat(2_000) },
        { role: "user", content: "b".repeat(2_000) },
        { role: "assistant", content: "c".repeat(2_000) },
        { role: "user", content: "d".repeat(2_000) },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes("6,000 characters"))).toBe(true);
  });
});
