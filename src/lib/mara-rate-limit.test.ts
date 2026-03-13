import { describe, expect, it } from "vitest";

import { buildMaraRateLimitMessage, formatMaraRetryAfter, getMaraRateLimitRules } from "@/lib/mara-rate-limit";

describe("mara rate limits", () => {
  it("formats short retry windows in seconds", () => {
    expect(formatMaraRetryAfter(12)).toBe("12s");
  });

  it("formats minute-scale retry windows in minutes", () => {
    expect(formatMaraRetryAfter(61)).toBe("2m");
  });

  it("formats hour-scale retry windows in hours", () => {
    expect(formatMaraRetryAfter(7_201)).toBe("3h");
  });

  it("keeps pro limits broader than free", () => {
    expect(getMaraRateLimitRules("PRO")).toHaveLength(3);
    expect(getMaraRateLimitRules("FREE")).toEqual([{ key: "2 requests per minute", maxRequests: 2, windowMs: 60_000 }]);
  });

  it("builds a user-facing rate limit message", () => {
    const [rule] = getMaraRateLimitRules("FREE");
    expect(buildMaraRateLimitMessage(rule, 30)).toBe(
      "You have hit the Mara limit of 2 requests per minute. Try again in about 30s."
    );
  });
});
