import type { SubscriptionStatusValue, SubscriptionTierValue } from "@/lib/contracts";

export type BillingFeatureKey =
  | "liveDashboard"
  | "liveReplan"
  | "aiConcierge"
  | "tripCollaboration"
  | "plannerDuplication"
  | "plannerTemplates"
  | "versionHistory"
  | "professionalExports";

export type BillingPlan = {
  tier: SubscriptionTierValue;
  name: string;
  monthlyPrice: number;
  monthlyLabel: string;
  tagline: string;
  summary: string;
  badge: string;
  activePlannerLimit: number;
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

// Legacy preview counter stays in the schema for now, but Mara is included on every plan.
export const MARA_FREE_PREVIEW_REPLY_LIMIT = 1;
export const MARA_STARTER_REPLY_LIMIT = MARA_FREE_PREVIEW_REPLY_LIMIT;

export const BILLING_PLANS: Record<SubscriptionTierValue, BillingPlan> = {
  FREE: {
    tier: "FREE",
    name: "Free",
    monthlyPrice: 0,
    monthlyLabel: "$0",
    tagline: "Full Mara",
    summary: "Full Mara, planner sharing, trip setup, itinerary views, calendar access, and one active planner for your current trip or outing.",
    badge: "Best for one active plan",
    activePlannerLimit: 1,
    features: [
      "Full Mara on 1 active planner",
      "Trip setup with dates, group details, must-dos, and dining preferences",
      "Share the planner and invite collaborators",
      "Build and view generated itinerary routes",
      "Calendar view, private trip feed, and notifications",
      "1 active planner",
    ],
  },
  PLUS: {
    tier: "PLUS",
    name: "Plus",
    monthlyPrice: 12,
    monthlyLabel: "$12",
    tagline: "More room",
    summary: "Everything in Free, plus live mode, replans, and room for up to three active planners.",
    badge: "Best plan for most people",
    activePlannerLimit: 3,
    features: [
      "Everything in Free",
      "Full Mara on up to 3 active planners",
      "Live dashboard with next-move guidance",
      "Instant replans and ride-completion controls",
      "3 active planners",
    ],
  },
  PRO: {
    tier: "PRO",
    name: "Pro",
    monthlyPrice: 29,
    monthlyLabel: "$29",
    tagline: "Scale up",
    summary: "Everything in Plus, plus more planner room, duplication, templates, and version history for higher-volume planning.",
    badge: "For repeat planners",
    activePlannerLimit: 10,
    features: [
      "Everything in Plus",
      "10 active planners",
      "Planner duplication",
      "Reusable planner templates",
      "Version history and saved snapshots",
    ],
  },
};

export const BILLING_FEATURES: Record<BillingFeatureKey, BillingFeatureDefinition> = {
  liveDashboard: {
    label: "Live park dashboard",
    requiredTier: "PLUS",
    upgradeTitle: "Live trip mode is part of Plus",
    upgradeDescription: "Open the live dashboard, keep the next move visible, and let Parqara adapt the day around what is changing.",
    highlights: ["Live conditions and alerts", "On-the-ground next step guidance", "A dedicated dashboard for the park day"],
  },
  liveReplan: {
    label: "Instant replans",
    requiredTier: "PLUS",
    upgradeTitle: "One-tap replans unlock on Plus",
    upgradeDescription: "Let Parqara rebalance the rest of the day when waits spike, closures hit, or your pace changes.",
    highlights: ["Replan around changing waits", "Adapt to closures and slowdowns", "Keep the rest of the route intact"],
  },
  aiConcierge: {
    label: "Mara access",
    requiredTier: "FREE",
    upgradeTitle: "Mara is included on every plan",
    upgradeDescription: "Every plan includes full Mara. Upgrade when you need more active planners, live mode, or higher-volume planning tools.",
    highlights: ["Included on every plan", "Follow-up questions and revisions", "Memory-backed, trip-specific guidance"],
  },
  tripCollaboration: {
    label: "Shared planner collaboration",
    requiredTier: "FREE",
    upgradeTitle: "Shared planner collaboration is included on every plan",
    upgradeDescription: "Invite existing Parqara users, manage access, and keep one planner visible to everyone working on the same trip on any plan.",
    highlights: ["Invite collaborators by email", "Manage shared planner access", "Keep group planning in one place"],
  },
  plannerDuplication: {
    label: "Planner duplication",
    requiredTier: "PRO",
    upgradeTitle: "Planner duplication is on Pro",
    upgradeDescription: "Duplicate a planner when you need to reuse a structure, branch a plan, or spin up a client-ready variant quickly.",
    highlights: ["Reuse a proven brief", "Branch without overwriting", "Move faster across multiple planners"],
  },
  plannerTemplates: {
    label: "Planner templates",
    requiredTier: "PRO",
    upgradeTitle: "Planner templates are on Pro",
    upgradeDescription: "Save repeatable planning setups as templates so future planners start from a stronger baseline.",
    highlights: ["Save repeatable structures", "Reuse preferred defaults", "Designed for repeat planners"],
  },
  versionHistory: {
    label: "Version history",
    requiredTier: "PRO",
    upgradeTitle: "Version history is on Pro",
    upgradeDescription: "Track meaningful planner snapshots as the plan changes so power users can review and compare versions cleanly.",
    highlights: ["Snapshot important changes", "Review planning evolution", "Supports higher-volume workflows"],
  },
  professionalExports: {
    label: "Future export tools",
    requiredTier: "PRO",
    upgradeTitle: "Future export tools are reserved for Pro",
    upgradeDescription: "Pro keeps room for a later export workspace, but the shipped workflow focus today is duplication, templates, versions, and collaboration.",
    highlights: ["Reserved for future export tools", "Kept on the Pro workflow tier", "Not a shipped workspace yet"],
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

export function getPlannerLimitForTier(tier: SubscriptionTierValue) {
  return BILLING_PLANS[tier].activePlannerLimit;
}

export function canAccessBillingFeature(currentTier: SubscriptionTierValue, feature: BillingFeatureKey) {
  return hasTierAccess(currentTier, BILLING_FEATURES[feature].requiredTier);
}

export function canUseFullMara(
  input:
    | SubscriptionTierValue
    | {
        subscriptionTier?: SubscriptionTierValue | null;
        subscriptionStatus?: SubscriptionStatusValue | null;
      }
) {
  const currentTier =
    typeof input === "string"
      ? input
      : getEffectiveSubscriptionTier(input.subscriptionTier, input.subscriptionStatus);

  return canAccessBillingFeature(currentTier, "aiConcierge");
}

export function canUseFreePreview() {
  return false;
}

export function canCreatePlanner(input: {
  activePlannerCount: number;
  currentTier?: SubscriptionTierValue;
  subscriptionTier?: SubscriptionTierValue | null;
  subscriptionStatus?: SubscriptionStatusValue | null;
}) {
  const currentTier =
    input.currentTier ?? getEffectiveSubscriptionTier(input.subscriptionTier, input.subscriptionStatus);

  return input.activePlannerCount < getPlannerLimitForTier(currentTier);
}

export function canDuplicatePlanner(currentTier: SubscriptionTierValue) {
  return canAccessBillingFeature(currentTier, "plannerDuplication");
}

export function canUseTemplates(currentTier: SubscriptionTierValue) {
  return canAccessBillingFeature(currentTier, "plannerTemplates");
}

export function canUseVersionHistory(currentTier: SubscriptionTierValue) {
  return canAccessBillingFeature(currentTier, "versionHistory");
}

export function canUseProfessionalExports(currentTier: SubscriptionTierValue) {
  return canAccessBillingFeature(currentTier, "professionalExports");
}

export function getMaraStarterPreviewState(
  currentTier: SubscriptionTierValue,
  usedReplies: number | null | undefined
): MaraStarterPreviewState {
  void currentTier;
  void usedReplies;

  return {
    included: false,
    replyLimit: MARA_FREE_PREVIEW_REPLY_LIMIT,
    usedReplies: 0,
    remainingReplies: 0,
    canSend: false,
  };
}

export function getUserBillingState(user: {
  subscriptionTier?: SubscriptionTierValue | null;
  subscriptionStatus?: SubscriptionStatusValue | null;
  maraPreviewRepliesUsed?: number | null;
  activePlannerCount?: number | null;
}) {
  const currentTier = getEffectiveSubscriptionTier(user.subscriptionTier, user.subscriptionStatus);
  const plannerLimit = getPlannerLimitForTier(currentTier);
  const activePlannerCount = Math.max(0, user.activePlannerCount ?? 0);

  return {
    currentTier,
    currentPlan: getPlanByTier(currentTier),
    featureAccess: {
      liveDashboard: canAccessBillingFeature(currentTier, "liveDashboard"),
      liveReplan: canAccessBillingFeature(currentTier, "liveReplan"),
      aiConcierge: canAccessBillingFeature(currentTier, "aiConcierge"),
      tripCollaboration: canAccessBillingFeature(currentTier, "tripCollaboration"),
      plannerDuplication: canAccessBillingFeature(currentTier, "plannerDuplication"),
      plannerTemplates: canAccessBillingFeature(currentTier, "plannerTemplates"),
      versionHistory: canAccessBillingFeature(currentTier, "versionHistory"),
      professionalExports: canAccessBillingFeature(currentTier, "professionalExports"),
    },
    plannerAllowance: {
      activeCount: activePlannerCount,
      limit: plannerLimit,
      remaining: Math.max(0, plannerLimit - activePlannerCount),
      canCreate: canCreatePlanner({ currentTier, activePlannerCount }),
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
