import type { SubscriptionTierValue } from "@/lib/contracts";

export type MaraRateLimitRule = {
  key: string;
  maxRequests: number;
  windowMs: number;
};

const ONE_MINUTE_MS = 60_000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

export const MARA_RATE_LIMIT_RULES: Record<SubscriptionTierValue, MaraRateLimitRule[]> = {
  FREE: [{ key: "1 request per minute", maxRequests: 1, windowMs: ONE_MINUTE_MS }],
  PLUS: [
    { key: "6 requests per minute", maxRequests: 6, windowMs: ONE_MINUTE_MS },
    { key: "60 requests per hour", maxRequests: 60, windowMs: ONE_HOUR_MS },
    { key: "250 requests per day", maxRequests: 250, windowMs: ONE_DAY_MS },
  ],
  PRO: [
    { key: "10 requests per minute", maxRequests: 10, windowMs: ONE_MINUTE_MS },
    { key: "120 requests per hour", maxRequests: 120, windowMs: ONE_HOUR_MS },
    { key: "500 requests per day", maxRequests: 500, windowMs: ONE_DAY_MS },
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
