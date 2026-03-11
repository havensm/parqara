import { describe, expect, it } from "vitest";

import type { PartyProfileDto } from "@/lib/contracts";

import {
  computeSummaryMetrics,
  recommendNextAction,
  scoreCandidate,
} from "@/server/engine/recommendation-engine";
import type {
  AttractionMetadata,
  RoutingProvider,
  WaitTimeSnapshot,
} from "@/server/providers/contracts";

const routing: RoutingProvider = {
  async getWalkingMinutes({ from, to }) {
    if (!from) {
      return 4;
    }

    return from.zone === to.zone ? 4 : 10;
  },
};

const partyProfile: PartyProfileDto = {
  partySize: 4,
  kidsAges: [6, 9],
  thrillTolerance: "MEDIUM",
  walkingTolerance: "MEDIUM",
  preferredRideTypes: ["coaster", "dark-ride", "quick-service"],
  mustDoRideIds: ["headliner"],
  diningPreferences: ["quick-service", "dessert"],
  startTime: "08:00",
  breakStart: "13:15",
  breakEnd: "13:45",
};

function attraction(overrides: Partial<AttractionMetadata> = {}): AttractionMetadata {
  return {
    id: "default",
    slug: "default",
    name: "Default Attraction",
    category: "RIDE",
    zone: "Launch Pier",
    description: null,
    thrillLevel: 3,
    minHeight: null,
    kidFriendly: true,
    indoor: true,
    familyFriendly: true,
    durationMinutes: 8,
    xCoord: 10,
    yCoord: 10,
    tags: ["dark-ride"],
    typicalWaitProfile: {
      8: 10,
      9: 18,
      10: 24,
      11: 36,
      12: 44,
      13: 52,
      14: 50,
      15: 46,
      16: 38,
      17: 28,
      18: 20,
      19: 16,
      20: 10,
      21: 6,
    },
    status: "OPEN",
    ...overrides,
  };
}

function waitSnapshot(entries: WaitTimeSnapshot["waits"]): WaitTimeSnapshot {
  return {
    waits: entries,
    alerts: [],
  };
}

describe("recommendation engine", () => {
  it("weights must-do headliners above lower-priority options", async () => {
    const mustDo = attraction({
      id: "headliner",
      slug: "comet-run",
      name: "Comet Run",
      thrillLevel: 4,
      tags: ["coaster"],
    });
    const filler = attraction({
      id: "filler",
      slug: "harbor-carousel",
      name: "Harbor Carousel",
      thrillLevel: 1,
      tags: ["gentle"],
    });

    const resultMustDo = await scoreCandidate({
      attraction: mustDo,
      partyProfile,
      currentTime: new Date("2026-03-21T08:10:00-05:00"),
      currentLocation: null,
      parkCloseTime: "22:00",
      waitSnapshot: waitSnapshot([
        { attractionId: mustDo.id, attractionSlug: mustDo.slug, waitMinutes: 12, status: "OPEN" },
        { attractionId: filler.id, attractionSlug: filler.slug, waitMinutes: 12, status: "OPEN" },
      ]),
      routing,
      mode: "standard",
      remainingMustDoCount: 1,
    });
    const resultFiller = await scoreCandidate({
      attraction: filler,
      partyProfile,
      currentTime: new Date("2026-03-21T08:10:00-05:00"),
      currentLocation: null,
      parkCloseTime: "22:00",
      waitSnapshot: waitSnapshot([
        { attractionId: mustDo.id, attractionSlug: mustDo.slug, waitMinutes: 12, status: "OPEN" },
        { attractionId: filler.id, attractionSlug: filler.slug, waitMinutes: 12, status: "OPEN" },
      ]),
      routing,
      mode: "standard",
      remainingMustDoCount: 1,
    });

    expect(resultMustDo?.score).toBeGreaterThan(resultFiller?.score ?? 0);
  });

  it("returns null for closed rides while open alternatives still score", async () => {
    const closedHeadliner = attraction({ id: "headliner", slug: "eclipse-drop", name: "Eclipse Drop", thrillLevel: 5, kidFriendly: false, familyFriendly: false, tags: ["coaster"] });
    const openAlternative = attraction({ id: "alt", slug: "nebula-drift", name: "Nebula Drift", thrillLevel: 2, tags: ["dark-ride"] });
    const snapshot = waitSnapshot([
      { attractionId: closedHeadliner.id, attractionSlug: closedHeadliner.slug, waitMinutes: null, status: "TEMPORARILY_CLOSED" },
      { attractionId: openAlternative.id, attractionSlug: openAlternative.slug, waitMinutes: 18, status: "OPEN" },
    ]);

    const closedResult = await scoreCandidate({
      attraction: closedHeadliner,
      partyProfile,
      currentTime: new Date("2026-03-21T10:30:00-05:00"),
      currentLocation: null,
      parkCloseTime: "22:00",
      waitSnapshot: snapshot,
      routing,
      mode: "standard",
      remainingMustDoCount: 1,
    });
    const openResult = await scoreCandidate({
      attraction: openAlternative,
      partyProfile,
      currentTime: new Date("2026-03-21T10:30:00-05:00"),
      currentLocation: null,
      parkCloseTime: "22:00",
      waitSnapshot: snapshot,
      routing,
      mode: "standard",
      remainingMustDoCount: 1,
    });

    expect(closedResult).toBeNull();
    expect(openResult?.attraction.id).toBe("alt");
  });

  it("switches into meal mode during the lunch window", async () => {
    const dining = attraction({ id: "meal", slug: "boardwalk-bento", name: "Boardwalk Bento", category: "DINING", tags: ["quick-service"] });
    const ride = attraction({ id: "ride", slug: "cosmo-quest", name: "Cosmo Quest", tags: ["dark-ride"] });

    const recommendation = await recommendNextAction({
      attractions: [ride, dining],
      partyProfile,
      currentTime: new Date("2026-03-21T12:10:00-05:00"),
      currentLocation: null,
      parkCloseTime: "22:00",
      waitSnapshot: waitSnapshot([
        { attractionId: ride.id, attractionSlug: ride.slug, waitMinutes: 15, status: "OPEN" },
        { attractionId: dining.id, attractionSlug: dining.slug, waitMinutes: 6, status: "OPEN" },
      ]),
      routing,
      completedAttractionIds: new Set<string>(),
      completedBreak: false,
    });

    expect(recommendation?.attraction.category).toBe("DINING");
  });

  it("computes summary metrics with time savings and efficiency", () => {
    const metrics = computeSummaryMetrics(
      [
        { predictedWaitMinutes: 14, walkingMinutes: 8, type: "RIDE" },
        { predictedWaitMinutes: 18, walkingMinutes: 6, type: "RIDE" },
        { predictedWaitMinutes: 10, walkingMinutes: 5, type: "SHOW" },
      ],
      2
    );

    expect(metrics.ridesCompleted).toBe(3);
    expect(metrics.timeSavedMinutes).toBeGreaterThan(0);
    expect(metrics.efficiencyScore).toBeGreaterThan(70);
    expect(metrics.replanCount).toBe(2);
  });
});
