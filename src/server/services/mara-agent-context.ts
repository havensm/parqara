import type { TripStatusValue } from "@/lib/contracts";
import { buildPreferenceSummary } from "@/lib/onboarding";
import { getTripDetail, listDashboardTrips } from "@/server/services/trip-service";
import { getOnboardingState, getUserWithPreference } from "@/server/services/user-service";

export type PlannerContext = {
  firstName: string | null;
  summaryItems: string[];
  planningPriorities: string[];
  planningStyle: string;
  budgetPreference: string;
  travelDistancePreference: string;
  planningHelpLevel: string;
  dietaryPreferences: string[];
  accessibilityNeeds: string[];
  additionalNotes: string;
  recentTrips: Array<{
    name: string;
    parkName: string;
    status: TripStatusValue;
    latestPlanSummary: string | null;
  }>;
  focusedTrip: {
    name: string;
    parkName: string;
    status: TripStatusValue;
    visitDate: string;
    latestPlanSummary: string | null;
    partySize: number;
    kidsAges: number[];
    thrillTolerance: string;
    walkingTolerance: string;
    preferredRideTypes: string[];
    diningPreferences: string[];
    startTime: string;
    breakStart: string | null;
    breakEnd: string | null;
    itineraryPreview: string[];
    currentStep: number;
  } | null;
};

export function formatPlannerValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Not set";
}

export function formatPlannerList(values: string[]) {
  return values.length ? values.map((value) => value.replaceAll("-", " ")).join(", ") : "Not set";
}

export async function getPlannerContext(userId: string, tripId?: string): Promise<PlannerContext> {
  const [user, onboarding, recentTrips, focusedTrip] = await Promise.all([
    getUserWithPreference(userId),
    getOnboardingState(userId),
    listDashboardTrips(userId),
    tripId ? getTripDetail(userId, tripId) : Promise.resolve(null),
  ]);

  return {
    firstName: user.firstName,
    summaryItems: buildPreferenceSummary(onboarding.values),
    planningPriorities: onboarding.values.planningPriorities,
    planningStyle: onboarding.values.planningStyle,
    budgetPreference: onboarding.values.budgetPreference,
    travelDistancePreference: onboarding.values.travelDistancePreference,
    planningHelpLevel: onboarding.values.planningHelpLevel,
    dietaryPreferences: onboarding.values.dietaryPreferences,
    accessibilityNeeds: onboarding.values.accessibilityNeeds,
    additionalNotes: onboarding.values.additionalNotes,
    recentTrips: recentTrips.slice(0, 3).map((trip) => ({
      name: trip.name,
      parkName: trip.parkName,
      status: trip.status,
      latestPlanSummary: trip.latestPlanSummary,
    })),
    focusedTrip: focusedTrip
      ? {
          name: focusedTrip.name,
          parkName: focusedTrip.park.name,
          status: focusedTrip.status,
          visitDate: focusedTrip.visitDate,
          latestPlanSummary: focusedTrip.latestPlanSummary,
          partySize: focusedTrip.partyProfile.partySize,
          kidsAges: focusedTrip.partyProfile.kidsAges,
          thrillTolerance: focusedTrip.partyProfile.thrillTolerance,
          walkingTolerance: focusedTrip.partyProfile.walkingTolerance,
          preferredRideTypes: focusedTrip.partyProfile.preferredRideTypes,
          diningPreferences: focusedTrip.partyProfile.diningPreferences,
          startTime: focusedTrip.partyProfile.startTime,
          breakStart: focusedTrip.partyProfile.breakStart,
          breakEnd: focusedTrip.partyProfile.breakEnd,
          itineraryPreview: focusedTrip.itinerary.slice(0, 5).map((item) => item.title),
          currentStep: focusedTrip.currentStep,
        }
      : null,
  };
}
