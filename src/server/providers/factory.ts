import type { ProviderSuite } from "@/server/providers/contracts";
import { createExplanationProvider } from "@/server/providers/mock/ai-provider";
import { PrismaParkMetadataProvider } from "@/server/providers/mock/park-metadata-provider";
import { MockRoutingProvider } from "@/server/providers/mock/routing-provider";
import { MockWaitTimeProvider } from "@/server/providers/mock/wait-time-provider";
import { MockWeatherProvider } from "@/server/providers/mock/weather-provider";

export function createProviderSuite(): ProviderSuite {
  const metadata = new PrismaParkMetadataProvider();

  return {
    metadata,
    waitTimes: new MockWaitTimeProvider(metadata),
    weather: new MockWeatherProvider(),
    routing: new MockRoutingProvider(),
    ai: createExplanationProvider(),
  };
}

