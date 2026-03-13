import { redirect } from "next/navigation";

import { getUserBillingState } from "@/lib/billing";
import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import {
  buildTripPlannerNeededQuestions,
  buildTripPlannerTripContext,
} from "@/lib/trip-planner-agent";
import {
  buildTripWorkspaceTabs,
  getTripWorkspaceStatusDetail,
} from "@/lib/trip-workspace";
import { getTripDetail, listDashboardTrips } from "@/server/services/trip-service";

import { TripPlannerConcierge } from "@/components/assistant/trip-planner-concierge";
import { ItineraryView } from "@/components/trip/itinerary-view";
import { TripWorkspaceHeader } from "@/components/trip/trip-workspace-header";

export default async function TripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const user = await requireCompletedOnboardingUser();
  const billing = getUserBillingState(user);
  const { tripId } = await params;
  const [trip, trips] = await Promise.all([
    getTripDetail(user.id, tripId),
    listDashboardTrips(user.id),
  ]);

  if (trip.status === "DRAFT") {
    redirect(`/trips/new?tripId=${trip.id}`);
  }

  const tripContext = buildTripPlannerTripContext(trip);
  const questions = buildTripPlannerNeededQuestions(trip);
  const tabs = buildTripWorkspaceTabs(trips);

  return (
    <div className="space-y-6">
      <TripWorkspaceHeader
        currentTier={billing.currentTier}
        activeTrip={{
          id: trip.id,
          name: trip.name,
          isOwner: trip.isOwner,
          parkName: trip.park.name,
          visitDate: trip.visitDate,
          status: trip.status,
          statusDetail: getTripWorkspaceStatusDetail({
            status: trip.status,
            currentStep: trip.currentStep,
            itineraryCount: trip.itinerary.length,
          }),
        }}
        tabs={tabs.map((tab) => ({
          ...tab,
          isActive: tab.id === trip.id,
        }))}
      />

      <TripPlannerConcierge
        currentTier={billing.currentTier}
        maraStarterRepliesUsed={billing.maraStarterPreview.usedReplies}
        firstName={user.firstName ?? user.name ?? null}
        tripContext={tripContext}
        questions={questions}
      />

      <ItineraryView currentTier={billing.currentTier} trip={trip} />
    </div>
  );
}
