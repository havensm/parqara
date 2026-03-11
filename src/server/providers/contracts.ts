import type { AlertDto, Severity, WeatherDto } from "@/lib/contracts";

export type AttractionMetadata = {
  id: string;
  slug: string;
  name: string;
  category: "RIDE" | "SHOW" | "DINING" | "PLAY";
  zone: string;
  description: string | null;
  thrillLevel: number;
  minHeight: number | null;
  kidFriendly: boolean;
  indoor: boolean;
  familyFriendly: boolean;
  durationMinutes: number;
  xCoord: number;
  yCoord: number;
  tags: string[];
  typicalWaitProfile: Record<number, number>;
  status: "OPEN" | "TEMPORARILY_CLOSED" | "WEATHER_DELAY";
};

export type ParkMetadata = {
  park: {
    id: string;
    slug: string;
    name: string;
    resort: string;
    description: string | null;
    opensAt: string;
    closesAt: string;
  };
  attractions: AttractionMetadata[];
};

export type LiveWait = {
  attractionId: string;
  attractionSlug: string;
  waitMinutes: number | null;
  status: "OPEN" | "TEMPORARILY_CLOSED" | "WEATHER_DELAY";
};

export type ExplanationPhase = "initial" | "replan" | "live";

export type RecommendationExplanationArgs = {
  parkName: string;
  attractionName: string;
  phase: ExplanationPhase;
  reason: string;
  topFactors: string[];
};

export type ReplanExplanationArgs = {
  parkName: string;
  cause: string;
  changes: string[];
};

export type WaitTimeSnapshot = {
  waits: LiveWait[];
  alerts: AlertDto[];
};

export interface ParkMetadataProvider {
  getParkBySlug(slug: string): Promise<ParkMetadata | null>;
  getParkById(id: string): Promise<ParkMetadata | null>;
}

export interface WaitTimeProvider {
  getLiveWaits(args: { parkId: string; at: Date }): Promise<WaitTimeSnapshot>;
}

export interface WeatherProvider {
  getWeather(args: { parkId: string; at: Date }): Promise<WeatherDto>;
}

export interface RoutingProvider {
  getWalkingMinutes(args: {
    from: AttractionMetadata | null;
    to: AttractionMetadata;
    at: Date;
  }): Promise<number>;
}

export interface RecommendationExplanationProvider {
  explainItineraryStep(args: RecommendationExplanationArgs): Promise<string>;
  explainReplan(args: ReplanExplanationArgs): Promise<string>;
}

export type ProviderSuite = {
  metadata: ParkMetadataProvider;
  waitTimes: WaitTimeProvider;
  weather: WeatherProvider;
  routing: RoutingProvider;
  ai: RecommendationExplanationProvider;
};

export type ActiveAlert = {
  severity: Severity;
  title: string;
  detail: string;
};
