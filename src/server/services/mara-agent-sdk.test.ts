import { describe, expect, it } from "vitest";

import { mapTripPlannerMessagesToAgentInputItems } from "@/server/services/mara-agent-sdk";

describe("mapTripPlannerMessagesToAgentInputItems", () => {
  it("keeps only the most recent messages and maps roles to SDK items", () => {
    const messages = Array.from({ length: 14 }, (_, index) => ({
      role: index % 2 === 0 ? ("assistant" as const) : ("user" as const),
      content: `message ${index}`,
    }));

    const items = mapTripPlannerMessagesToAgentInputItems(messages);

    expect(items).toHaveLength(12);
    expect(items[0]).toMatchObject({
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text: "message 2" }],
    });
    expect(items[1]).toMatchObject({
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: "message 3" }],
    });
    expect(items.at(-1)).toMatchObject({
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: "message 13" }],
    });
  });
});
