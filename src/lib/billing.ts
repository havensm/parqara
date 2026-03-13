import type { SubscriptionStatusValue, SubscriptionTierValue } from "@/lib/contracts";

export type BillingFeatureKey = "liveDashboard" | "liveReplan" | "aiConcierge" | "tripCollaboration";

export type BillingPlan = {
  tier: SubscriptionTierValue;
  name: string;
  monthlyPrice: number;
  monthlyLabel: string;
  tagline: string;
  summary: string;
  badge: string;
  features: string[];
};

export type BillingFeatureDefinition = {
  label: string;
  requiredTier: SubscriptionTierValue;
  upgradeTitle: string;
  upgradeDescription: string;
  highlights: string[];
};

export type MaraStarterPreviewState = {
  included: boolean;
  replyLimit: number;
  usedReplies: number;
  remainingReplies: number;
  canSend: boolean;
};

const tierRank: Record<SubscriptionTierValue, number> = {
  FREE: 0,
  PLUS: 1,
  PRO: 2,
};

const activeStatuses = new Set<SubscriptionStatusValue>(["ACTIVE", "TRIALING"]);

export const MARA_STARTER_REPLY_LIMIT = 3;

export const BILLING_PLANS: Record<SubscriptionTierValue, BillingPlan> = {
  FREE: {
    tier: "FREE",
    name: "Free",
    monthlyPrice: 0,
    monthlyLabel: "$0",
    tagline: "Core planning",
    summary: "Planner, saved defaults, trip summaries, and 3 Mara starter replies.",
    badge: "Best for trying the product",
    features: ["Saved planning profile", "Trip setup and itinerary builder", "Trip detail pages and summaries", "3 Mara starter replies"],
  },
  PLUS: {
    tier: "PLUS",
    name: "Plus",
    monthlyPrice: 12,
    monthlyLabel: "$12",
    tagline: "For live park days",
    summary: "Everything in Free, plus live guidance, replans, and alerts.",
    badge: "Popular",
    features: ["Everything in Free", "Live park dashboard", "One-tap replans and live alerts"],
  },
  PRO: {
    tier: "PRO",
    name: "Pro",
    monthlyPrice: 29,
    monthlyLabel: "$29",
    tagline: "For power planners",
    summary: "Everything in Plus, plus unlimited Mara and shared planners.",
    badge: "For groups and frequent planners",
    features: ["Everything in Plus", "Unlimited Mara AI concierge", "Trip collaborators and shared planning"],
  },
};

export const BILLING_FEATURES: Record<BillingFeatureKey, BillingFeatureDefinition> = {
  liveDashboard: {
    label: "Live park dashboard",
    requiredTier: "PLUS",
    upgradeTitle: "Live park mode is part of Plus",
    upgradeDescription: "Track the next best move with live waits, operational alerts, and an at-the-moment park readout.",
    highlights: ["Live conditions and alerts", "On-the-ground next step guidance", "A dedicated dashboard for the park day"],
  },
  liveReplan: {
    label: "Instant replans",
    requiredTier: "PLUS",
    upgradeTitle: "One-tap replans unlock on Plus",
    upgradeDescription: "Let Parqara rebalance the rest of the day when waits spike, closures hit, or the pace changes.",
    highlights: ["Replan around changing waits", "Adapt to closures and slowdowns", "Keep the rest of the route intact"],
  },
  aiConcierge: {
    label: "Mara AI concierge",
    requiredTier: "PRO",
    upgradeTitle: "Full Mara concierge is part of Pro",
    upgradeDescription: "Free and Plus can sample Mara with a short starter preview. Upgrade to Pro for ongoing, trip-specific planning chat.",
    highlights: ["A short Mara starter preview on Free and Plus", "Unlimited trip-specific planning chat", "Context-aware follow-up questions and refinements"],
  },
  tripCollaboration: {
    label: "Trip collaboration",
    requiredTier: "PRO",
    upgradeTitle: "Shared trip workspaces are on Pro",
    upgradeDescription: "Invite other Parqara users into the same trip so the plan can be shaped together.",
    highlights: ["Invite collaborators by email", "Shared visibility into the trip", "Centralize group edits in one workspace"],
  },
};

export function getPlanByTier(tier: SubscriptionTierValue) {
  return BILLING_PLANS[tier];
}

export function getEffectiveSubscriptionTier(
  tier: SubscriptionTierValue | null | undefined,
  status: SubscriptionStatusValue | null | undefined
): SubscriptionTierValue {
  if (!tier || tier === "FREE") {
    return "FREE";
  }

  return status && activeStatuses.has(status) ? tier : "FREE";
}

export function hasTierAccess(currentTier: SubscriptionTierValue, requiredTier: SubscriptionTierValue) {
  return tierRank[currentTier] >= tierRank[requiredTier];
}

export function canAccessBillingFeature(currentTier: SubscriptionTierValue, feature: BillingFeatureKey) {
  return hasTierAccess(currentTier, BILLING_FEATURES[feature].requiredTier);
}

export function getMaraStarterPreviewState(
  currentTier: SubscriptionTierValue,
  usedReplies: number | null | undefined
): MaraStarterPreviewState {
  const normalizedUsedReplies = Math.max(0, usedReplies ?? 0);
  const fullAccess = canAccessBillingFeature(currentTier, "aiConcierge");

  if (fullAccess) {
    return {
      included: false,
      replyLimit: MARA_STARTER_REPLY_LIMIT,
      usedReplies: 0,
      remainingReplies: 0,
      canSend: false,
    };
  }

  const remainingReplies = Math.max(0, MARA_STARTER_REPLY_LIMIT - normalizedUsedReplies);

  return {
    included: true,
    replyLimit: MARA_STARTER_REPLY_LIMIT,
    usedReplies: normalizedUsedReplies,
    remainingReplies,
    canSend: remainingReplies > 0,
  };
}

export function getUserBillingState(user: {
  subscriptionTier?: SubscriptionTierValue | null;
  subscriptionStatus?: SubscriptionStatusValue | null;
  maraPreviewRepliesUsed?: number | null;
}) {
  const currentTier = getEffectiveSubscriptionTier(user.subscriptionTier, user.subscriptionStatus);

  return {
    currentTier,
    currentPlan: getPlanByTier(currentTier),
    featureAccess: {
      liveDashboard: canAccessBillingFeature(currentTier, "liveDashboard"),
      liveReplan: canAccessBillingFeature(currentTier, "liveReplan"),
      aiConcierge: canAccessBillingFeature(currentTier, "aiConcierge"),
      tripCollaboration: canAccessBillingFeature(currentTier, "tripCollaboration"),
    },
    maraStarterPreview: getMaraStarterPreviewState(currentTier, user.maraPreviewRepliesUsed),
  };
}

export function getBillingStatusLabel(status: SubscriptionStatusValue | null | undefined) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "TRIALING":
      return "Trialing";
    case "PAST_DUE":
      return "Past due";
    case "CANCELED":
      return "Canceled";
    case "UNPAID":
      return "Unpaid";
    default:
      return "Free";
  }
}



