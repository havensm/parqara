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
  FREE: [{ key: "2 requests per minute", maxRequests: 2, windowMs: ONE_MINUTE_MS }],
  PLUS: [{ key: "2 requests per minute", maxRequests: 2, windowMs: ONE_MINUTE_MS }],
  PRO: [
    { key: "4 requests per minute", maxRequests: 4, windowMs: ONE_MINUTE_MS },
    { key: "40 requests per hour", maxRequests: 40, windowMs: ONE_HOUR_MS },
    { key: "150 requests per day", maxRequests: 150, windowMs: ONE_DAY_MS },
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

export function buildMaraRateLimitMessage(rule: MaraRateLimitRule, retryAfterSeconds: number) {
  return `You have hit the Mara limit of ${rule.key}. Try again in about ${formatMaraRetryAfter(retryAfterSeconds)}.`;
}
