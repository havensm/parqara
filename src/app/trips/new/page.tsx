import { addDays } from "date-fns";
import { redirect } from "next/navigation";

import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import { pickDefaultTrip } from "@/lib/trip-workspace";
import { getPlannerLimitState } from "@/server/services/planner-entitlement-service";
import {
  createDefaultDraftTrip,
  getDefaultParkSummary,
  getTripDetail,
  listDashboardTrips,
} from "@/server/services/trip-service";

import { ParksUnavailableState } from "@/components/app/parks-unavailable-state";
import { PlannerLimitCard } from "@/components/trip/planner-limit-card";

export default async function NewTripPage({ searchParams }: { searchParams: Promise<{ fresh?: string; tripId?: string }> }) {
  const user = await requireCompletedOnboardingUser();
  const plannerLimitState = await getPlannerLimitState(user.id);
  const defaultVisitDate = addDays(new Date(), 7).toISOString().slice(0, 10);
  const { fresh, tripId } = await searchParams;
  const shouldReuseExistingPlanner = !tripId && fresh !== "1";
  const [defaultPark, existingTrips] = await Promise.all([
    tripId ? null : getDefaultParkSummary(),
    shouldReuseExistingPlanner ? listDashboardTrips(user.id) : Promise.resolve([]),
  ]);

  if (shouldReuseExistingPlanner) {
    const existingTrip = pickDefaultTrip(existingTrips);
    redirect(existingTrip ? `/dashboard?tripId=${existingTrip.id}` : "/dashboard");
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

  if (fresh === "1" && !tripId) {
    if (!defaultPark) {
      return <ParksUnavailableState />;
    }

    const trip = await createDefaultDraftTrip(user.id, defaultPark.slug, defaultVisitDate);
    redirect(`/dashboard?tripId=${trip.id}`);
  }

  if (!tripId) {
    redirect("/dashboard");
  }

  const trip = await getTripDetail(user.id, tripId);

  // Draft planners now always open in the Mara-first dashboard.
  if (trip.status === "DRAFT") {
    redirect(`/dashboard?tripId=${trip.id}`);
  }

  redirect(`/trips/${trip.id}`);
}
