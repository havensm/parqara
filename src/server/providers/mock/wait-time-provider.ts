import type {
  ParkMetadataProvider,
  WaitTimeProvider,
  WaitTimeSnapshot,
} from "@/server/providers/contracts";
import {
  getScenarioForAttraction,
  getActiveScenarios,
  getWeatherPoint,
} from "@/server/providers/mock/helpers";
import { getWaitProfileValue } from "@/server/providers/mock/mock-data";

export class MockWaitTimeProvider implements WaitTimeProvider {
  constructor(private readonly metadataProvider: ParkMetadataProvider) {}

  async getLiveWaits({ parkId, at }: { parkId: string; at: Date }): Promise<WaitTimeSnapshot> {
    const park = await this.metadataProvider.getParkById(parkId);

    if (!park) {
      return {
        waits: [],
        alerts: [],
      };
    }

    const weather = getWeatherPoint(at);
    const activeScenarios = getActiveScenarios(at);
    const baseCrowdMultiplier = [0, 6].includes(at.getDay()) ? 1.08 : 1;

    const alerts = activeScenarios.map((scenario) => ({
      severity: scenario.severity,
      title: scenario.title,
      detail: scenario.description,
    }));

    const waits = park.attractions.map((attraction) => {
      const scenarioMatches = getScenarioForAttraction(activeScenarios, attraction.slug);
      let status = attraction.status;
      let waitMinutes = Math.round(
        getWaitProfileValue(attraction.typicalWaitProfile, at.getHours()) * baseCrowdMultiplier
      );

      if (attraction.category === "DINING" && [11, 12, 17, 18].includes(at.getHours())) {
        waitMinutes += 4;
      }

      for (const scenario of scenarioMatches) {
        if (scenario.closed) {
          status = scenario.type === "weather" ? "WEATHER_DELAY" : "TEMPORARILY_CLOSED";
          waitMinutes = 0;
        }

        if (scenario.waitDelta) {
          waitMinutes += scenario.waitDelta;
        }
      }

      if (weather.condition === "LIGHT_SHOWERS" && !attraction.indoor && status === "OPEN") {
        waitMinutes += 6;
      }

      return {
        attractionId: attraction.id,
        attractionSlug: attraction.slug,
        waitMinutes: status === "OPEN" ? waitMinutes : null,
        status,
      };
    });

    return {
      waits,
      alerts,
    };
  }
}

