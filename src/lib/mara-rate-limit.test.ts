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

  it("keeps paid tiers broader than free across burst and daily limits", () => {
    const freeRules = getMaraRateLimitRules("FREE");
    const plusRules = getMaraRateLimitRules("PLUS");
    const proRules = getMaraRateLimitRules("PRO");

    expect(freeRules).toEqual([
      { key: "1 request per 10 seconds", maxRequests: 1, windowMs: 10_000 },
      { key: "10 requests per hour", maxRequests: 10, windowMs: 3_600_000 },
      { key: "30 requests per day", maxRequests: 30, windowMs: 86_400_000 },
    ]);
    expect(plusRules).toHaveLength(3);
    expect(proRules).toHaveLength(3);
    expect(proRules[0].maxRequests).toBeGreaterThan(plusRules[0].maxRequests);
    expect(proRules[2].maxRequests).toBeGreaterThan(freeRules[2].maxRequests);
  });

  it("builds a user-facing rate limit message", () => {
    const [rule] = getMaraRateLimitRules("FREE");
    expect(buildMaraRateLimitMessage(rule, 30)).toBe(
      "Mara has reached the current fair-use guardrail for your plan. Try again in about 30s."
    );
  });
});
