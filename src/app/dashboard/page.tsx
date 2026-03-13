import { addDays } from "date-fns";

import { getUserBillingState } from "@/lib/billing";
import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import {
  buildTripPlannerNeededQuestions,
  buildTripPlannerTripContext,
} from "@/lib/trip-planner-agent";
import {
  buildTripWorkspaceTabs,
  getTripWorkspaceStatusDetail,
  isPlannerKickoffDraft,
  pickDefaultTrip,
} from "@/lib/trip-workspace";
import {
  createDefaultDraftTrip,
  getDefaultParkSummary,
  getParkCatalog,
  getTripDetail,
  listDashboardTrips,
} from "@/server/services/trip-service";

import { ParksUnavailableState } from "@/components/app/parks-unavailable-state";
import { TripPlannerConcierge } from "@/components/assistant/trip-planner-concierge";
import { FirstTimePlannerTour } from "@/components/onboarding/first-time-planner-tour";
import { ItineraryView } from "@/components/trip/itinerary-view";
import { TripForm } from "@/components/trip/trip-form";
import { TripWorkspaceHeader } from "@/components/trip/trip-workspace-header";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tour?: string; tourPreview?: string }> }) {
  const user = await requireCompletedOnboardingUser();
  const billing = getUserBillingState(user);
  const defaultVisitDate = addDays(new Date(), 7).toISOString().slice(0, 10);
  const defaultPark = await getDefaultParkSummary();
  const { tour, tourPreview } = await searchParams;
  const showFirstTimeTour = user.isFirstTime || tour === "1";
  const previewFirstTimeTour = tourPreview === "1";
  let trips = await listDashboardTrips(user.id);

  if (!trips.length && !defaultPark) {
    return <ParksUnavailableState />;
  }

  let activeTrip: Awaited<ReturnType<typeof getTripDetail>>;

  if (!trips.length) {
    activeTrip = await createDefaultDraftTrip(user.id, defaultPark!.slug, defaultVisitDate);
    trips = await listDashboardTrips(user.id);
  } else {
    const defaultTrip = pickDefaultTrip(trips);
    if (!defaultTrip) {
      throw new Error("No trip available.");
    }

    activeTrip = await getTripDetail(user.id, defaultTrip.id);
  }

  const isStarterDraft = isPlannerKickoffDraft({
    status: activeTrip.status,
    currentStep: activeTrip.currentStep,
    itineraryCount: activeTrip.itinerary.length,
  });
  const catalog = activeTrip.status === "DRAFT" ? await getParkCatalog(activeTrip.park.slug) : null;
  const tripContext = isStarterDraft ? undefined : buildTripPlannerTripContext(activeTrip);
  const questions = isStarterDraft ? [] : buildTripPlannerNeededQuestions(activeTrip);
  const tabs = buildTripWorkspaceTabs(trips);

  return (
    <>
      <div className="space-y-5">
        <div data-tour-id="planner-workspace">
          <TripWorkspaceHeader
            currentTier={billing.currentTier}
            starterMode={isStarterDraft}
            activeTrip={{
              id: activeTrip.id,
              name: activeTrip.name,
              isOwner: activeTrip.isOwner,
              parkName: activeTrip.park.name,
              visitDate: activeTrip.visitDate,
              status: activeTrip.status,
              statusDetail: getTripWorkspaceStatusDetail({
                status: activeTrip.status,
                currentStep: activeTrip.currentStep,
                itineraryCount: activeTrip.itinerary.length,
              }),
            }}
            tabs={tabs.map((tab) => ({
              ...tab,
              isActive: tab.id === activeTrip.id,
            }))}
          />
        </div>

        <section data-tour-id="mara-concierge">
          <TripPlannerConcierge
            currentTier={billing.currentTier}
            maraStarterRepliesUsed={billing.maraStarterPreview.usedReplies}
            firstName={user.firstName ?? user.name ?? null}
            tripContext={tripContext}
            questions={questions}
            priorityMode
          />
        </section>

        <section data-tour-id="planning-panel">
          {activeTrip.status === "DRAFT" && catalog ? (
            <TripForm catalog={catalog} initialTrip={activeTrip} />
          ) : (
            <ItineraryView currentTier={billing.currentTier} trip={activeTrip} />
          )}
        </section>
      </div>
      <FirstTimePlannerTour enabled={showFirstTimeTour} preview={previewFirstTimeTour} />
    </>
  );
}
