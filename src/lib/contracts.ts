export type Severity = "info" | "warning" | "critical";

export type AttractionCategoryValue = "RIDE" | "SHOW" | "DINING" | "PLAY";
export type ThrillToleranceValue = "LOW" | "MEDIUM" | "HIGH";
export type WalkingToleranceValue = "LOW" | "MEDIUM" | "HIGH";
export type TripStatusValue = "DRAFT" | "PLANNED" | "LIVE" | "COMPLETED";
export type PlannerStatusValue = "ACTIVE" | "ARCHIVED";
export type ItineraryItemTypeValue = "RIDE" | "SHOW" | "DINING" | "BREAK";
export type ItineraryItemStatusValue =
  | "PLANNED"
  | "COMPLETED"
  | "SKIPPED"
  | "CANCELLED";
export type SubscriptionTierValue = "FREE" | "PLUS" | "PRO";
export type SubscriptionStatusValue = "INACTIVE" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID";

export type AttractionOption = {
  id: string;
  slug: string;
  name: string;
  category: AttractionCategoryValue;
  zone: string;
  thrillLevel: number;
  kidFriendly: boolean;
  familyFriendly: boolean;
  tags: string[];
};

export type ParkCatalogDto = {
  park: {
    id: string;
    slug: string;
    name: string;
    resort: string;
    description: string | null;
    opensAt: string;
    closesAt: string;
  };
  attractions: AttractionOption[];
  mustDoOptions: AttractionOption[];
  rideTypeOptions: Array<{ value: string; label: string }>;
  diningPreferenceOptions: Array<{ value: string; label: string }>;
};

export type PartyProfileDto = {
  partySize: number;
  kidsAges: number[];
  thrillTolerance: ThrillToleranceValue;
  walkingTolerance: WalkingToleranceValue;
  preferredRideTypes: string[];
  mustDoRideIds: string[];
  diningPreferences: string[];
  startTime: string;
  breakStart: string | null;
  breakEnd: string | null;
};

export type ItineraryItemDto = {
  id: string;
  attractionId: string | null;
  attractionSlug: string | null;
  title: string;
  type: ItineraryItemTypeValue;
  order: number;
  startTime: string;
  endTime: string;
  arrivalWindowStart: string;
  arrivalWindowEnd: string;
  predictedWaitMinutes: number;
  walkingMinutes: number;
  confidence: number;
  reason: string;
  explanation: string;
  status: ItineraryItemStatusValue;
  zone: string | null;
  category: AttractionCategoryValue | null;
  thrillLevel: number | null;
  kidFriendly: boolean | null;
};

export type TripDetailDto = {
  id: string;
  name: string;
  isOwner: boolean;
  status: TripStatusValue;
  plannerStatus: PlannerStatusValue;
  startingLocation: string | null;
  visitDate: string;
  simulatedTime: string | null;
  currentStep: number;
  latestPlanSummary: string | null;
  park: ParkCatalogDto["park"];
  partyProfile: PartyProfileDto;
  itinerary: ItineraryItemDto[];
};

export type DashboardTripDto = {
  id: string;
  name: string;
  status: TripStatusValue;
  plannerStatus: PlannerStatusValue;
  startingLocation: string | null;
  visitDate: string;
  parkName: string;
  itineraryCount: number;
  currentItemTitle: string | null;
  latestPlanSummary: string | null;
  currentStep: number;
  isOwner: boolean;
  metrics: Record<string, unknown> | null;
};

export type PlannerLimitStateDto = {
  currentTier: SubscriptionTierValue;
  activePlannerCount: number;
  plannerLimit: number;
  canCreate: boolean;
  activeTrips: Array<Pick<DashboardTripDto, "id" | "name" | "status" | "visitDate" | "parkName">>;
  archivedTrips: Array<Pick<DashboardTripDto, "id" | "name" | "status" | "visitDate" | "parkName">>;
};

export type PlannerVersionDto = {
  id: string;
  label: string;
  createdAt: string;
};

export type PlannerTemplateDto = {
  id: string;
  name: string;
  createdAt: string;
};

export type TripCollaboratorDto = {
  id: string;
  userId: string;
  email: string;
  name: string;
};

export type UserPersonDto = {
  id: string;
  userId: string;
  email: string;
  name: string;
};

export type TripPendingInviteDto = {
  id: string;
  email: string;
};

export type TripCollaboratorStateDto = {
  tripId: string;
  canManage: boolean;
  owner: TripCollaboratorDto;
  collaborators: TripCollaboratorDto[];
  pendingInvites: TripPendingInviteDto[];
  people: UserPersonDto[];
};

export type ProfilePendingInviteDto = {
  id: string;
  email: string;
};

export type ProfilePeopleStateDto = {
  people: UserPersonDto[];
  pendingInvites: ProfilePendingInviteDto[];
};

export type AppNotificationTypeValue = "SYSTEM" | "TRAVEL" | "WEATHER" | "RIDE_STATUS" | "PLANNER" | "COLLABORATION";

export type NotificationDto = {
  id: string;
  type: AppNotificationTypeValue;
  severity: Severity;
  title: string;
  detail: string;
  actionHref: string | null;
  tripId: string | null;
  tripName: string | null;
  actorName: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationCenterDto = {
  unreadCount: number;
  notifications: NotificationDto[];
};

export type WeatherDto = {
  condition: string;
  tempF: number;
  rainChance: number;
  summary: string;
};

export type AlertDto = {
  severity: Severity;
  title: string;
  detail: string;
};

export type LiveRecommendationDto = {
  attractionId: string | null;
  attractionSlug: string | null;
  title: string;
  reason: string;
  explanation: string;
  waitMinutes: number;
  walkingMinutes: number;
  confidence: number;
  zone: string | null;
};

export type LiveDashboardDto = {
  tripId: string;
  tripName: string;
  status: TripStatusValue;
  simulatedTime: string;
  currentAction: ItineraryItemDto | null;
  recommendation: LiveRecommendationDto | null;
  upcomingItems: ItineraryItemDto[];
  alerts: AlertDto[];
  weather: WeatherDto;
  latestPlanSummary: string | null;
};

export type SummaryDto = {
  tripId: string;
  tripName: string;
  visitDate: string;
  metrics: {
    ridesCompleted: number;
    timeSavedMinutes: number;
    averagePredictedWait: number;
    efficiencyScore: number;
    replanCount: number;
  };
  completedItems: ItineraryItemDto[];
  highlights: string[];
  latestPlanSummary: string | null;
};


