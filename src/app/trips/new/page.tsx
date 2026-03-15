import { addDays } from "date-fns";
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
  getTripWorkspaceHref,
  getTripWorkspaceStatusDetail,
  isPlannerKickoffDraft,
  pickDefaultTrip,
} from "@/lib/trip-workspace";
import { getPlannerLimitState } from "@/server/services/planner-entitlement-service";
import {
  createDefaultDraftTrip,
  findOrCreateDraftTrip,
  getDefaultParkSummary,
  getParkCatalog,
  getTripDetail,
  listDashboardTrips,
} from "@/server/services/trip-service";

import { ParksUnavailableState } from "@/components/app/parks-unavailable-state";
import { MaraPlannerFocus } from "@/components/trip/mara-planner-focus";
import { PlannerLimitCard } from "@/components/trip/planner-limit-card";
import { PlannerWorkspaceRail } from "@/components/trip/planner-workspace-rail";
import { PlannerWorkspaceShell } from "@/components/trip/planner-workspace-shell";
import { TripForm } from "@/components/trip/trip-form";
import { TripWorkspaceHeader } from "@/components/trip/trip-workspace-header";

export default async function NewTripPage({ searchParams }: { searchParams: Promise<{ fresh?: string; tripId?: string }> }) {
  const user = await requireCompletedOnboardingUser();
  const billing = getUserBillingState(user);
  const adminEnabled = isAdminEmail(user.email);
  const plannerLimitState = await getPlannerLimitState(user.id);
  const defaultVisitDate = addDays(new Date(), 7).toISOString().slice(0, 10);
  const { fresh, tripId } = await searchParams;
  const shouldReuseExistingPlanner = !tripId && fresh !== "1";
  const [defaultPark, existingTrips] = await Promise.all([
    tripId ? null : getDefaultParkSummary(),
    shouldReuseExistingPlanner ? listDashboardTrips(user.id) : Promise.resolve([]),
  ]);

  if (shouldReuseExistingPlanner && existingTrips.length) {
    const existingTrip = pickDefaultTrip(existingTrips);
    if (existingTrip) {
      redirect(getTripWorkspaceHref(existingTrip));
    }
  }

  if (fresh === "1" && !tripId && !plannerLimitState.canCreate) {
    return (
      <div className="space-y-6">
        <PlannerLimitCard
          limitState={plannerLimitState}
          title="You have reached your active planner limit."
          detail="Archive an existing planner or upgrade your plan before opening another active planner. Archived planners stay saved and can be restored later."
        />
      </div>
    );
  }

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
  const tripContext = buildTripPlannerTripContext(draftTrip);
  const questions = isStarterDraft ? [] : buildTripPlannerNeededQuestions(draftTrip);
  const tabs = buildTripWorkspaceTabs(trips);
  const plannerTabs = tabs.map((tab) => ({
    ...tab,
    isActive: tab.id === draftTrip.id,
  }));

  return (
    <PlannerWorkspaceShell
      currentTier={billing.currentTier}
      adminEnabled={adminEnabled}
      plannerTabs={plannerTabs}
      mobileMaraLabel="Start with Mara"
      leadPanel={
        <MaraPlannerFocus
          currentTier={billing.currentTier}
          tripId={draftTrip.id}
          firstName={user.firstName ?? user.name ?? null}
          trip={draftTrip}
          tripContext={tripContext}
          questions={questions}
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
          starterMode={isStarterDraft}
          embedded
          showCreateAction={false}
          showPlannerStack={false}
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
          tabs={plannerTabs}
        />
      }
      modules={[
        {
          label: "Overview",
          detail: "Return to the main planner workspace",
          href: "/dashboard",
          tone: "teal",
        },
        {
          label: "Plan",
          detail: "Trip basics, must-dos, notes, and budget",
          active: true,
          tone: "sky",
        },
        {
          label: "Itinerary",
          detail: "Unlocks once the routed day exists",
          tone: "indigo",
        },
        {
          label: "Live",
          detail: "Open when the route is ready to run",
          tone: "amber",
        },
      ]}
      rail={
        <PlannerWorkspaceRail
          currentTier={billing.currentTier}
          plannerLimitState={plannerLimitState}
          tabs={plannerTabs}
          activeTrip={{
            id: draftTrip.id,
            name: draftTrip.name,
            status: draftTrip.status,
            isOwner: draftTrip.isOwner,
          }}
        />
      }
    >
      <TripForm catalog={catalog} initialTrip={draftTrip} />
    </PlannerWorkspaceShell>
  );
}
