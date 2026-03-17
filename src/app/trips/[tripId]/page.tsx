import { redirect } from "next/navigation";

import { getUserBillingState } from "@/lib/billing";
import { isAdminEmail } from "@/lib/admin";
import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import { getApproximateRequestLocation } from "@/lib/request-location";
import {
  buildTripPlannerNeededQuestions,
  buildTripPlannerTripContext,
} from "@/lib/trip-planner-agent";
import {
  buildTripWorkspaceTabs,
  getTripWorkspaceStatusDetail,
} from "@/lib/trip-workspace";
import { getPlannerLimitState } from "@/server/services/planner-entitlement-service";
import { getTripDetail, listDashboardTrips } from "@/server/services/trip-service";

import { ItineraryView } from "@/components/trip/itinerary-view";
import { MaraPlannerFocus } from "@/components/trip/mara-planner-focus";
import { PlannerWorkspaceRail } from "@/components/trip/planner-workspace-rail";
import { PlannerWorkspaceShell } from "@/components/trip/planner-workspace-shell";
import { TripWorkspaceHeader } from "@/components/trip/trip-workspace-header";

export default async function TripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const user = await requireCompletedOnboardingUser();
  const billing = getUserBillingState(user);
  const adminEnabled = isAdminEmail(user.email);
  const { tripId } = await params;
  const [trip, trips, plannerLimitState, approximateLocation] = await Promise.all([
    getTripDetail(user.id, tripId),
    listDashboardTrips(user.id),
    getPlannerLimitState(user.id),
    getApproximateRequestLocation(),
  ]);

  if (trip.status === "DRAFT") {
    redirect(`/trips/new?tripId=${trip.id}`);
  }

  const tripContext = buildTripPlannerTripContext(trip);
  const questions = buildTripPlannerNeededQuestions(trip);
  const tabs = buildTripWorkspaceTabs(trips);
  const plannerTabs = tabs.map((tab) => ({
    ...tab,
    isActive: tab.id === trip.id,
  }));

  return (
    <PlannerWorkspaceShell
      currentTier={billing.currentTier}
      adminEnabled={adminEnabled}
      plannerTabs={plannerTabs}
      mobileMaraLabel="Ask Mara about this trip"
      leadPanel={
        <MaraPlannerFocus
          key={trip.id}
          currentTier={billing.currentTier}
          tripId={trip.id}
          firstName={user.firstName ?? user.name ?? null}
          trip={trip}
          tripContext={tripContext}
          questions={questions}
          approximateLocation={approximateLocation?.label ?? null}
        />
      }
      workspaceHeader={
        <TripWorkspaceHeader
          currentTier={billing.currentTier}
          plannerAllowance={{
            activeCount: plannerLimitState.activePlannerCount,
            limit: plannerLimitState.plannerLimit,
            archivedCount: plannerLimitState.archivedTrips.length,
          }}
          embedded
          showCreateAction={false}
          showPlannerStack={false}
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
          tabs={plannerTabs}
        />
      }
      modules={[
        {
          label: "Overview",
          detail: "Plan health, signals, and next move",
          active: true,
          tone: "teal",
        },
        {
          label: "Plan",
          detail: "This trip workspace and route posture",
          href: `/trips/${trip.id}`,
          tone: "sky",
        },
        {
          label: "Itinerary",
          detail: "Open the full routed timeline",
          href: `/trips/${trip.id}/itinerary`,
          tone: "indigo",
        },
        {
          label: "Live",
          detail: "Open day-of monitoring and replans",
          href: `/trips/${trip.id}/live`,
          tone: "amber",
        },
      ]}
      rail={
        <PlannerWorkspaceRail
          currentTier={billing.currentTier}
          plannerLimitState={plannerLimitState}
          tabs={plannerTabs}
          activeTrip={{
            id: trip.id,
            name: trip.name,
            status: trip.status,
            isOwner: trip.isOwner,
          }}
        />
      }
    >
      <ItineraryView currentTier={billing.currentTier} trip={trip} />
    </PlannerWorkspaceShell>
  );
}












