import { redirect } from "next/navigation";

import { getUserBillingState } from "@/lib/billing";
import { isAdminEmail } from "@/lib/admin";
import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
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

import { TripPlannerConcierge } from "@/components/assistant/trip-planner-concierge";
import { FeatureUpsellCard } from "@/components/billing/feature-upsell-card";
import { DetailedItineraryView } from "@/components/trip/detailed-itinerary-view";
import { PlannerWorkspaceRail } from "@/components/trip/planner-workspace-rail";
import { PlannerWorkspaceShell } from "@/components/trip/planner-workspace-shell";
import { TripPlannerSettingsDialog } from "@/components/trip/trip-planner-settings-dialog";
import { TripWorkspaceHeader } from "@/components/trip/trip-workspace-header";

export default async function TripItineraryPage({ params }: { params: Promise<{ tripId: string }> }) {
  const user = await requireCompletedOnboardingUser();
  const billing = getUserBillingState(user);
  const adminEnabled = isAdminEmail(user.email);
  const { tripId } = await params;
  const [trip, trips, plannerLimitState] = await Promise.all([
    getTripDetail(user.id, tripId),
    listDashboardTrips(user.id),
    getPlannerLimitState(user.id),
  ]);

  if (trip.status === "DRAFT") {
    redirect(`/dashboard?tripId=${trip.id}`);
  }

  if (!trip.itinerary.length) {
    redirect(`/trips/${trip.id}`);
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
      mobileMaraLabel="Ask Mara about this route"
      workspaceHeader={
        <TripWorkspaceHeader
          currentTier={billing.currentTier}
          plannerAllowance={{
            activeCount: plannerLimitState.activePlannerCount,
            limit: plannerLimitState.plannerLimit,
            archivedCount: plannerLimitState.archivedTrips.length,
          }}
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
          label: "Mara",
          detail: "Open the chat-first planning workspace",
          href: `/dashboard?tripId=${trip.id}`,
          tone: "teal",
        },
        {
          label: "Details",
          detail: "Trip report, logistics, and snapshot tools",
          href: `/trips/${trip.id}`,
          tone: "sky",
        },
        {
          label: "Itinerary",
          detail: "Full route timing and logic",
          active: true,
          tone: "indigo",
        },
        {
          label: "Live",
          detail: "Open day-of monitoring and replans",
          href: `/trips/${trip.id}/live`,
          tone: "amber",
        },
      ]}
      maraPanel={
        billing.featureAccess.aiConcierge ? (
          <TripPlannerConcierge
            currentTier={billing.currentTier}
            tripId={trip.id}
            firstName={user.firstName ?? user.name ?? null}
            tripContext={tripContext}
            initialMessages={trip.maraChatHistory}
            canResetConversation={trip.canEdit}
            questions={questions}
            headerAction={
              <TripPlannerSettingsDialog
                currentTier={billing.currentTier}
                tripId={trip.id}
                tripName={trip.name}
                isOwner={trip.isOwner}
                triggerMode="icon"
              />
            }
          />
        ) : (
          <FeatureUpsellCard feature="aiConcierge" currentTier={billing.currentTier} actionHref="/pricing" />
        )
      }
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
      <DetailedItineraryView trip={trip} />
    </PlannerWorkspaceShell>
  );
}








