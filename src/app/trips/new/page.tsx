import { addDays } from "date-fns";
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
  isPlannerKickoffDraft,
} from "@/lib/trip-workspace";
import {
  createDefaultDraftTrip,
  findOrCreateDraftTrip,
  getDefaultParkSummary,
  getParkCatalog,
  getTripDetail,
  listDashboardTrips,
} from "@/server/services/trip-service";

import { ParksUnavailableState } from "@/components/app/parks-unavailable-state";
import { TripPlannerConcierge } from "@/components/assistant/trip-planner-concierge";
import { TripForm } from "@/components/trip/trip-form";
import { TripWorkspaceHeader } from "@/components/trip/trip-workspace-header";

export default async function NewTripPage({ searchParams }: { searchParams: Promise<{ fresh?: string; tripId?: string }> }) {
  const user = await requireCompletedOnboardingUser();
  const billing = getUserBillingState(user);
  const defaultVisitDate = addDays(new Date(), 7).toISOString().slice(0, 10);
  const { fresh, tripId } = await searchParams;
  const defaultPark = tripId ? null : await getDefaultParkSummary();

  if (fresh === "1" && !tripId && defaultPark) {
    const trip = await createDefaultDraftTrip(user.id, defaultPark.slug, defaultVisitDate);
    redirect(`/trips/new?tripId=${trip.id}`);
  }

  const draftTrip = tripId
    ? await getTripDetail(user.id, tripId)
    : defaultPark
      ? await findOrCreateDraftTrip(user.id, defaultPark.slug, defaultVisitDate)
      : null;

  if (!draftTrip) {
    return <ParksUnavailableState />;
  }

  if (draftTrip.status !== "DRAFT") {
    redirect(`/trips/${draftTrip.id}`);
  }

  const [catalog, trips] = await Promise.all([
    getParkCatalog(draftTrip.park.slug),
    listDashboardTrips(user.id),
  ]);
  const isStarterDraft = isPlannerKickoffDraft({
    status: draftTrip.status,
    currentStep: draftTrip.currentStep,
    itineraryCount: draftTrip.itinerary.length,
  });
  const tripContext = isStarterDraft ? undefined : buildTripPlannerTripContext(draftTrip);
  const questions = isStarterDraft ? [] : buildTripPlannerNeededQuestions(draftTrip);
  const tabs = buildTripWorkspaceTabs(trips);

  return (
    <div className="space-y-6">
      <TripWorkspaceHeader
        currentTier={billing.currentTier}
        starterMode={isStarterDraft}
        activeTrip={{
          id: draftTrip.id,
          name: draftTrip.name,
          isOwner: draftTrip.isOwner,
          parkName: draftTrip.park.name,
          visitDate: draftTrip.visitDate,
          status: draftTrip.status,
          statusDetail: getTripWorkspaceStatusDetail({
            status: draftTrip.status,
            currentStep: draftTrip.currentStep,
            itineraryCount: draftTrip.itinerary.length,
          }),
        }}
        tabs={tabs.map((tab) => ({
          ...tab,
          isActive: tab.id === draftTrip.id,
        }))}
      />

      <TripPlannerConcierge
        currentTier={billing.currentTier}
        maraStarterRepliesUsed={billing.maraStarterPreview.usedReplies}
        firstName={user.firstName ?? user.name ?? null}
        tripContext={tripContext}
        questions={questions}
      />

      <TripForm catalog={catalog} initialTrip={draftTrip} />
    </div>
  );
}
