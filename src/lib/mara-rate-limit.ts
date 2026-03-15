import type { SubscriptionTierValue } from "@/lib/contracts";

export type MaraRateLimitRule = {
  key: string;
  maxRequests: number;
  windowMs: number;
};

const ONE_SECOND_MS = 1_000;
const TEN_SECONDS_MS = 10 * ONE_SECOND_MS;
const FIFTEEN_SECONDS_MS = 15 * ONE_SECOND_MS;
const ONE_HOUR_MS = 60 * 60 * ONE_SECOND_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

// These rolling windows are the primary spend guardrail for Mara.
// They are intentionally shaped to feel fine for a human conversation while capping scripted flooding.
export const MARA_RATE_LIMIT_RULES: Record<SubscriptionTierValue, MaraRateLimitRule[]> = {
  FREE: [
    { key: "1 request per 10 seconds", maxRequests: 1, windowMs: TEN_SECONDS_MS },
    { key: "10 requests per hour", maxRequests: 10, windowMs: ONE_HOUR_MS },
    { key: "30 requests per day", maxRequests: 30, windowMs: ONE_DAY_MS },
  ],
  PLUS: [
    { key: "3 requests per 15 seconds", maxRequests: 3, windowMs: FIFTEEN_SECONDS_MS },
    { key: "40 requests per hour", maxRequests: 40, windowMs: ONE_HOUR_MS },
    { key: "150 requests per day", maxRequests: 150, windowMs: ONE_DAY_MS },
  ],
  PRO: [
    { key: "5 requests per 15 seconds", maxRequests: 5, windowMs: FIFTEEN_SECONDS_MS },
    { key: "80 requests per hour", maxRequests: 80, windowMs: ONE_HOUR_MS },
    { key: "300 requests per day", maxRequests: 300, windowMs: ONE_DAY_MS },
  ],
};

export function getMaraRateLimitRules(tier: SubscriptionTierValue) {
  return MARA_RATE_LIMIT_RULES[tier];
}

export function formatMaraRetryAfter(retryAfterSeconds: number) {
  if (retryAfterSeconds < 60) {
    return `${retryAfterSeconds}s`;
  }

  if (retryAfterSeconds < 3_600) {
    return `${Math.ceil(retryAfterSeconds / 60)}m`;
  }

  return `${Math.ceil(retryAfterSeconds / 3_600)}h`;
}

export function buildMaraRateLimitMessage(_: MaraRateLimitRule, retryAfterSeconds: number) {
  return `Mara has reached the current fair-use guardrail for your plan. Try again in about ${formatMaraRetryAfter(retryAfterSeconds)}.`;
}
