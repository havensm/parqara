import type { WeatherProvider } from "@/server/providers/contracts";
import { getWeatherPoint } from "@/server/providers/mock/helpers";

export class MockWeatherProvider implements WeatherProvider {
  async getWeather({ at }: { parkId: string; at: Date }) {
    const point = getWeatherPoint(at);
    return {
      condition: point.condition,
      tempF: point.tempF,
      rainChance: point.rainChance,
      summary: point.summary,
    };
  }
}

