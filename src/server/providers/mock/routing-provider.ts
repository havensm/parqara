import type { AttractionMetadata, RoutingProvider } from "@/server/providers/contracts";
import { getActiveScenarios } from "@/server/providers/mock/helpers";

function distance(from: AttractionMetadata, to: AttractionMetadata) {
  return Math.hypot(to.xCoord - from.xCoord, to.yCoord - from.yCoord);
}

export class MockRoutingProvider implements RoutingProvider {
  async getWalkingMinutes({ from, to, at }: { from: AttractionMetadata | null; to: AttractionMetadata; at: Date }) {
    if (!from) {
      return 6;
    }

    const activeScenarios = getActiveScenarios(at);
    const congestionDelta = activeScenarios.reduce((sum, scenario) => {
      if (scenario.walkingDelta && (scenario.attractionSlugs.includes(from.slug) || scenario.attractionSlugs.includes(to.slug))) {
        return sum + scenario.walkingDelta;
      }

      return sum;
    }, 0);

    const baseDistanceMinutes = Math.max(3, Math.round(distance(from, to) / 9));
    const zonePenalty = from.zone === to.zone ? 0 : 3;

    return baseDistanceMinutes + zonePenalty + congestionDelta;
  }
}

