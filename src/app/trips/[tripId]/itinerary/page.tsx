import { redirect } from "next/navigation";

import { getUserBillingState } from "@/lib/billing";
import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import {
  buildTripWorkspaceTabs,
  getTripWorkspaceStatusDetail,
} from "@/lib/trip-workspace";
import { getTripDetail, listDashboardTrips } from "@/server/services/trip-service";

import { DetailedItineraryView } from "@/components/trip/detailed-itinerary-view";
import { TripWorkspaceHeader } from "@/components/trip/trip-workspace-header";

export default async function TripItineraryPage({ params }: { params: Promise<{ tripId: string }> }) {
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

  if (!trip.itinerary.length) {
    redirect(`/trips/${trip.id}`);
  }

  const tabs = buildTripWorkspaceTabs(trips);
  const activeTab = tabs.find((tab) => tab.id === trip.id);

  return (
    <div className="space-y-6">
      <TripWorkspaceHeader
        currentTier={billing.currentTier}
        activeTrip={{
          id: trip.id,
          label: activeTab?.label ?? trip.name,
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

      <DetailedItineraryView trip={trip} />
    </div>
  );
}
