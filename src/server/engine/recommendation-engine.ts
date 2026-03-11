import type { PartyProfileDto } from "@/lib/contracts";
import { addMinutesSafe, minutesFromTime } from "@/lib/date-utils";
import type {
  AttractionMetadata,
  RoutingProvider,
  WaitTimeSnapshot,
} from "@/server/providers/contracts";

export type ScoredCandidate = {
  attraction: AttractionMetadata;
  waitMinutes: number;
  walkingMinutes: number;
  score: number;
  confidence: number;
  topFactors: string[];
  reason: string;
};

export type PlanDraftItem = {
  attraction: AttractionMetadata | null;
  title: string;
  type: "RIDE" | "SHOW" | "DINING" | "BREAK";
  startTime: Date;
  endTime: Date;
  arrivalWindowStart: Date;
  arrivalWindowEnd: Date;
  predictedWaitMinutes: number;
  walkingMinutes: number;
  score: number;
  confidence: number;
  reason: string;
  topFactors: string[];
};

type CandidateMode = "standard" | "meal" | "snack";

type ScoreCandidateArgs = {
  attraction: AttractionMetadata;
  partyProfile: PartyProfileDto;
  currentTime: Date;
  currentLocation: AttractionMetadata | null;
  parkCloseTime: string;
  waitSnapshot: WaitTimeSnapshot;
  routing: RoutingProvider;
  mode: CandidateMode;
  remainingMustDoCount: number;
};

type BuildPlanArgs = {
  attractions: AttractionMetadata[];
  partyProfile: PartyProfileDto;
  currentTime: Date;
  currentLocation: AttractionMetadata | null;
  parkCloseTime: string;
  waitSnapshot: WaitTimeSnapshot;
  routing: RoutingProvider;
  completedAttractionIds: Set<string>;
  completedBreak: boolean;
};

const WALKING_PENALTY = {
  LOW: 1.6,
  MEDIUM: 1.15,
  HIGH: 0.8,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getWaitEntry(waitSnapshot: WaitTimeSnapshot, attractionId: string) {
  return waitSnapshot.waits.find((wait) => wait.attractionId === attractionId);
}

function determineCandidateMode(currentMinutes: number, profile: PartyProfileDto, mealScheduled: boolean, snackScheduled: boolean) {
  if (!mealScheduled && currentMinutes >= 11 * 60 + 15 && currentMinutes <= 13 * 60 + 30) {
    return "meal" satisfies CandidateMode;
  }

  if (
    !snackScheduled &&
    currentMinutes >= 17 * 60 &&
    currentMinutes <= 19 * 60 + 15 &&
    profile.diningPreferences.some((preference) => preference === "dessert" || preference === "snacks")
  ) {
    return "snack" satisfies CandidateMode;
  }

  return "standard" satisfies CandidateMode;
}

function getBreakNeeded(currentMinutes: number, profile: PartyProfileDto, completedBreak: boolean) {
  if (completedBreak || !profile.breakStart || !profile.breakEnd) {
    return false;
  }

  return currentMinutes >= minutesFromTime(profile.breakStart) - 10 && currentMinutes <= minutesFromTime(profile.breakEnd);
}

function getSuitabilityModifier(attraction: AttractionMetadata, profile: PartyProfileDto) {
  const youngestChild = profile.kidsAges.length ? Math.min(...profile.kidsAges) : null;
  let modifier = 0;

  if (attraction.kidFriendly) {
    modifier += 8;
  }

  if (youngestChild !== null) {
    if (youngestChild <= 5 && attraction.thrillLevel >= 4) {
      modifier -= 80;
    }

    if (youngestChild <= 7 && attraction.thrillLevel === 5) {
      modifier -= 80;
    }
  }

  if (profile.thrillTolerance === "LOW" && attraction.thrillLevel >= 4) {
    modifier -= 55;
  }

  if (profile.thrillTolerance === "MEDIUM" && attraction.thrillLevel === 5) {
    modifier -= 18;
  }

  if (profile.thrillTolerance === "HIGH" && attraction.thrillLevel >= 4) {
    modifier += 6;
  }

  return modifier;
}

function buildReason(topFactors: string[]) {
  if (topFactors.length === 0) {
    return "This remains the best all-around move right now.";
  }

  if (topFactors.length === 1) {
    return topFactors[0];
  }

  return `${topFactors[0]} ${topFactors[1].toLowerCase()}`;
}

// The scoring model intentionally stays deterministic and legible so it can be
// replaced later by a learned model without changing the provider or API layer.
export async function scoreCandidate({
  attraction,
  partyProfile,
  currentTime,
  currentLocation,
  parkCloseTime,
  waitSnapshot,
  routing,
  mode,
  remainingMustDoCount,
}: ScoreCandidateArgs): Promise<ScoredCandidate | null> {
  const waitEntry = getWaitEntry(waitSnapshot, attraction.id);
  if (!waitEntry || waitEntry.status !== "OPEN" || waitEntry.waitMinutes === null) {
    return null;
  }

  if (mode === "standard" && attraction.category === "DINING") {
    return null;
  }

  if (mode === "meal" && attraction.category !== "DINING") {
    return null;
  }

  if (mode === "snack" && (attraction.category !== "DINING" || !attraction.tags.some((tag) => tag === "snacks" || tag === "dessert"))) {
    return null;
  }

  const walkingMinutes = await routing.getWalkingMinutes({
    from: currentLocation,
    to: attraction,
    at: currentTime,
  });
  const arrivalTime = addMinutesSafe(currentTime, walkingMinutes);
  const startTime = addMinutesSafe(arrivalTime, waitEntry.waitMinutes);
  const endTime = addMinutesSafe(startTime, attraction.durationMinutes);

  if (endTime.getHours() * 60 + endTime.getMinutes() > minutesFromTime(parkCloseTime)) {
    return null;
  }

  let score = 50;
  const positiveFactors: Array<{ label: string; value: number }> = [];
  const negativeFactors: Array<{ label: string; value: number }> = [];

  if (partyProfile.mustDoRideIds.includes(attraction.id)) {
    score += 35;
    positiveFactors.push({ label: "Must-do priority is pulling this to the top.", value: 35 });
  }

  const tagMatches = attraction.tags.filter((tag) => partyProfile.preferredRideTypes.includes(tag));
  if (tagMatches.length > 0) {
    score += 11;
    positiveFactors.push({
      label: `It matches your preferred ${tagMatches.slice(0, 2).join(" and ")} mix.`,
      value: 11,
    });
  }

  const diningMatches = attraction.tags.filter((tag) => partyProfile.diningPreferences.includes(tag));
  if (mode === "meal" && diningMatches.length > 0) {
    score += 14;
    positiveFactors.push({ label: "It lines up with your dining preferences and lunch timing.", value: 14 });
  }

  const suitabilityModifier = getSuitabilityModifier(attraction, partyProfile);
  score += suitabilityModifier;
  if (suitabilityModifier >= 8) {
    positiveFactors.push({ label: "The attraction fits the party age and thrill mix well.", value: suitabilityModifier });
  }
  if (suitabilityModifier <= -40) {
    negativeFactors.push({ label: "The party fit is poor for this attraction right now.", value: suitabilityModifier });
  }

  const middayBaseline = attraction.typicalWaitProfile[13] ?? waitEntry.waitMinutes;
  const crowdAdvantage = middayBaseline - waitEntry.waitMinutes;
  if (crowdAdvantage >= 12) {
    score += 12;
    positiveFactors.push({ label: "Current waits are meaningfully below this attraction's midday norm.", value: 12 });
  }

  if (waitEntry.waitMinutes <= 15) {
    score += 8;
    positiveFactors.push({ label: "The queue is short enough to keep momentum up.", value: 8 });
  }

  score -= waitEntry.waitMinutes * 0.78;
  negativeFactors.push({ label: `Estimated wait is ${waitEntry.waitMinutes} minutes.`, value: -waitEntry.waitMinutes * 0.78 });

  const walkingPenalty = walkingMinutes * WALKING_PENALTY[partyProfile.walkingTolerance];
  score -= walkingPenalty;
  negativeFactors.push({ label: `It takes about ${walkingMinutes} minutes to walk there.`, value: -walkingPenalty });

  if (currentLocation && currentLocation.zone === attraction.zone) {
    score += 6;
    positiveFactors.push({ label: "It keeps you in the same zone and limits backtracking.", value: 6 });
  }

  if (remainingMustDoCount >= 2 && attraction.category === "SHOW" && currentTime.getHours() < 14) {
    score -= 8;
    negativeFactors.push({ label: "Longer-form shows rank lower while must-do rides remain open.", value: -8 });
  }

  if (mode === "meal") {
    score += 18;
    positiveFactors.push({ label: "The meal window is open, so dining avoids a later crowd wall.", value: 18 });
  }

  if (mode === "snack") {
    score += 10;
    positiveFactors.push({ label: "This is a clean late-day snack reset before the final push.", value: 10 });
  }

  if (score <= 0) {
    return null;
  }

  const topFactors = [...positiveFactors]
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((factor) => factor.label);

  return {
    attraction,
    waitMinutes: waitEntry.waitMinutes,
    walkingMinutes,
    score,
    confidence: clamp(Math.round(40 + score * 0.6), 32, 97),
    topFactors,
    reason: buildReason(topFactors),
  };
}

export async function recommendNextAction(args: BuildPlanArgs) {
  const currentMinutes = args.currentTime.getHours() * 60 + args.currentTime.getMinutes();
  const mode = determineCandidateMode(currentMinutes, args.partyProfile, false, false);
  const remainingMustDoCount = args.partyProfile.mustDoRideIds.filter(
    (rideId) => !args.completedAttractionIds.has(rideId)
  ).length;

  const scored = await Promise.all(
    args.attractions
      .filter((attraction) => !args.completedAttractionIds.has(attraction.id))
      .map((attraction) =>
        scoreCandidate({
          attraction,
          partyProfile: args.partyProfile,
          currentTime: args.currentTime,
          currentLocation: args.currentLocation,
          parkCloseTime: args.parkCloseTime,
          waitSnapshot: args.waitSnapshot,
          routing: args.routing,
          mode,
          remainingMustDoCount,
        })
      )
  );

  return scored.filter((candidate): candidate is ScoredCandidate => candidate !== null).sort((a, b) => b.score - a.score)[0] ?? null;
}

export async function buildPlanDraft({
  attractions,
  partyProfile,
  currentTime,
  currentLocation,
  parkCloseTime,
  waitSnapshot,
  routing,
  completedAttractionIds,
  completedBreak,
}: BuildPlanArgs) {
  const usedAttractions = new Set(completedAttractionIds);
  const plan: PlanDraftItem[] = [];
  let timeCursor = new Date(currentTime);
  let location = currentLocation;
  let mealScheduled = false;
  let snackScheduled = false;
  let breakTaken = completedBreak;

  while (plan.length < 8) {
    const currentMinutes = timeCursor.getHours() * 60 + timeCursor.getMinutes();
    if (currentMinutes >= minutesFromTime(parkCloseTime) - 20) {
      break;
    }

    if (getBreakNeeded(currentMinutes, partyProfile, breakTaken)) {
      const breakStart = new Date(timeCursor);
      const breakEnd = addMinutesSafe(breakStart, 30);
      plan.push({
        attraction: null,
        title: "Recharge Break",
        type: "BREAK",
        startTime: breakStart,
        endTime: breakEnd,
        arrivalWindowStart: breakStart,
        arrivalWindowEnd: addMinutesSafe(breakStart, 5),
        predictedWaitMinutes: 0,
        walkingMinutes: 0,
        score: 65,
        confidence: 72,
        reason: "The planned break window is here, so taking a reset now protects the rest of the day.",
        topFactors: ["The group asked for a mid-day recharge window."],
      });
      timeCursor = breakEnd;
      breakTaken = true;
      continue;
    }

    const mode = determineCandidateMode(currentMinutes, partyProfile, mealScheduled, snackScheduled);
    const remainingMustDoCount = partyProfile.mustDoRideIds.filter((rideId) => !usedAttractions.has(rideId)).length;

    const scored = await Promise.all(
      attractions
        .filter((attraction) => !usedAttractions.has(attraction.id))
        .map((attraction) =>
          scoreCandidate({
            attraction,
            partyProfile,
            currentTime: timeCursor,
            currentLocation: location,
            parkCloseTime,
            waitSnapshot,
            routing,
            mode,
            remainingMustDoCount,
          })
        )
    );

    const next = scored.filter((candidate): candidate is ScoredCandidate => candidate !== null).sort((a, b) => b.score - a.score)[0];
    if (!next) {
      break;
    }

    const arrivalWindowStart = addMinutesSafe(timeCursor, next.walkingMinutes);
    const arrivalWindowEnd = addMinutesSafe(arrivalWindowStart, 10);
    const startTime = addMinutesSafe(arrivalWindowStart, next.waitMinutes);
    const endTime = addMinutesSafe(startTime, next.attraction.durationMinutes);

    plan.push({
      attraction: next.attraction,
      title: next.attraction.name,
      type: next.attraction.category === "PLAY" ? "RIDE" : next.attraction.category === "DINING" ? "DINING" : next.attraction.category,
      startTime,
      endTime,
      arrivalWindowStart,
      arrivalWindowEnd,
      predictedWaitMinutes: next.waitMinutes,
      walkingMinutes: next.walkingMinutes,
      score: next.score,
      confidence: next.confidence,
      reason: next.reason,
      topFactors: next.topFactors,
    });

    usedAttractions.add(next.attraction.id);
    if (mode === "meal") {
      mealScheduled = true;
    }
    if (mode === "snack") {
      snackScheduled = true;
    }

    location = next.attraction;
    timeCursor = endTime;
  }

  return plan;
}

export function computeSummaryMetrics(items: Array<{ predictedWaitMinutes: number; walkingMinutes: number; type: string }>, replanCount: number) {
  const rideItems = items.filter((item) => item.type === "RIDE" || item.type === "SHOW");
  const ridesCompleted = rideItems.length;
  const averagePredictedWait = ridesCompleted
    ? Math.round(rideItems.reduce((sum, item) => sum + item.predictedWaitMinutes, 0) / ridesCompleted)
    : 0;
  const naiveBaseline = rideItems.reduce((sum, item) => sum + item.predictedWaitMinutes + 16 + Math.round(item.walkingMinutes * 0.8), 0);
  const optimizedBaseline = rideItems.reduce((sum, item) => sum + item.predictedWaitMinutes + item.walkingMinutes, 0);
  const timeSavedMinutes = Math.max(0, naiveBaseline - optimizedBaseline);
  const efficiencyScore = clamp(Math.round(78 + timeSavedMinutes / 5 - replanCount * 2), 40, 98);

  return {
    ridesCompleted,
    timeSavedMinutes,
    averagePredictedWait,
    efficiencyScore,
    replanCount,
  };
}



