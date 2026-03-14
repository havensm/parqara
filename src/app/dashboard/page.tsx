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
  isPlannerKickoffDraft,
  pickDefaultTrip,
} from "@/lib/trip-workspace";
import { getPlannerLimitState } from "@/server/services/planner-entitlement-service";
import {
  createDefaultDraftTrip,
  getDefaultParkSummary,
  getParkCatalog,
  getTripDetail,
  listDashboardTrips,
} from "@/server/services/trip-service";

import { ParksUnavailableState } from "@/components/app/parks-unavailable-state";
import { FirstTimePlannerTour } from "@/components/onboarding/first-time-planner-tour";
import { MaraPlannerFocus } from "@/components/trip/mara-planner-focus";
import { PlannerDashboardDetails } from "@/components/trip/planner-dashboard-details";
import { PlannerWorkspaceShell } from "@/components/trip/planner-workspace-shell";
import { PlannerWorkspaceTabs } from "@/components/trip/planner-workspace-tabs";

type DashboardSearchParams = {
  create?: string;
  tour?: string;
  tourPreview?: string;
  tripId?: string;
};

function buildDashboardHref(params: DashboardSearchParams) {
  const search = new URLSearchParams();

  if (params.tripId) {
    search.set("tripId", params.tripId);
  }

  if (params.create) {
    search.set("create", params.create);
  }

  if (params.tour) {
    search.set("tour", params.tour);
  }

  if (params.tourPreview) {
    search.set("tourPreview", params.tourPreview);
  }

  const query = search.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const user = await requireCompletedOnboardingUser();
  const billing = getUserBillingState(user);
  const adminEnabled = isAdminEmail(user.email);
  const defaultVisitDate = addDays(new Date(), 7).toISOString().slice(0, 10);
  const [{ tour, tourPreview, tripId, create }, defaultPark] = await Promise.all([searchParams, getDefaultParkSummary()]);
  const showFirstTimeTour = user.isFirstTime || tour === "1";
  const previewFirstTimeTour = tourPreview === "1";
  const preservedDashboardParams = {
    tour,
    tourPreview,
  } satisfies Pick<DashboardSearchParams, "tour" | "tourPreview">;
  let trips = await listDashboardTrips(user.id);

  if (!trips.length && !defaultPark) {
    return <ParksUnavailableState />;
  }

  if (create === "1") {
    const initialPlannerLimitState = await getPlannerLimitState(user.id);

    if (initialPlannerLimitState.canCreate && defaultPark) {
      const trip = await createDefaultDraftTrip(user.id, defaultPark.slug, defaultVisitDate);
      redirect(buildDashboardHref({ tripId: trip.id, ...preservedDashboardParams }));
    }

    redirect(initialPlannerLimitState.canCreate ? "/trips/new" : billing.currentTier === "FREE" ? "/pricing" : "/billing");
  }

  if (!trips.length) {
    const starterTrip = await createDefaultDraftTrip(user.id, defaultPark!.slug, defaultVisitDate);
    trips = await listDashboardTrips(user.id);

    if (!tripId) {
      redirect(buildDashboardHref({ tripId: starterTrip.id, ...preservedDashboardParams }));
    }
  }

  const selectedTrip = (tripId ? trips.find((trip) => trip.id === tripId) : undefined) ?? pickDefaultTrip(trips);

  if (!selectedTrip) {
    throw new Error("No trip available.");
  }

  const [activeTrip, plannerLimitState] = await Promise.all([
    getTripDetail(user.id, selectedTrip.id),
    getPlannerLimitState(user.id),
  ]);
  const isStarterDraft = isPlannerKickoffDraft({
    status: activeTrip.status,
    currentStep: activeTrip.currentStep,
    itineraryCount: activeTrip.itinerary.length,
  });
  const catalog = activeTrip.status === "DRAFT" ? await getParkCatalog(activeTrip.park.slug) : null;
  const tripContext = isStarterDraft ? undefined : buildTripPlannerTripContext(activeTrip);
  const questions = isStarterDraft ? [] : buildTripPlannerNeededQuestions(activeTrip);
  // Dashboard keeps planner switching inside /dashboard via tripId-backed tabs instead of bouncing between separate pages.
  const plannerTabs = buildTripWorkspaceTabs(trips).map((tab) => ({
    ...tab,
    href: buildDashboardHref({ tripId: tab.id, ...preservedDashboardParams }),
    isActive: tab.id === activeTrip.id,
  }));
  const createPlannerHref = plannerLimitState.canCreate
    ? defaultPark
      ? buildDashboardHref({ create: "1", ...preservedDashboardParams })
      : "/trips/new"
    : billing.currentTier === "FREE"
      ? "/pricing"
      : "/billing";

  return (
    <>
      <PlannerWorkspaceShell
        currentTier={billing.currentTier}
        adminEnabled={adminEnabled}
        plannerTabs={plannerTabs}
        mobileMaraLabel={isStarterDraft ? "Start with Mara" : "Ask Mara"}
        boardMode
        boardTabs={
          <PlannerWorkspaceTabs
            tabs={plannerTabs}
            currentTier={billing.currentTier}
            activeCount={plannerLimitState.activePlannerCount}
            plannerLimit={plannerLimitState.plannerLimit}
            canCreate={plannerLimitState.canCreate}
            createHref={createPlannerHref}
          />
        }
        leadPanel={
          <MaraPlannerFocus
            currentTier={billing.currentTier}
            maraStarterRepliesUsed={billing.maraStarterPreview.usedReplies}
            tripId={activeTrip.id}
            firstName={user.firstName ?? user.name ?? null}
            trip={activeTrip}
            tripContext={tripContext}
            questions={questions}
          />
        }
      >
        <section data-tour-id="planning-panel">
          <PlannerDashboardDetails currentTier={billing.currentTier} trip={activeTrip} catalog={catalog} />
        </section>
      </PlannerWorkspaceShell>
      <FirstTimePlannerTour enabled={showFirstTimeTour} preview={previewFirstTimeTour} />
    </>
  );
}
