import Link from "next/link";

import { getUserBillingState } from "@/lib/billing";
import { isAdminEmail } from "@/lib/admin";
import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import { getApproximateRequestLocation } from "@/lib/request-location";
import { buildTripWorkspaceTabs, isPlannerKickoffDraft } from "@/lib/trip-workspace";
import { getPlannerLimitState } from "@/server/services/planner-entitlement-service";
import { getTripDetail, listDashboardTrips } from "@/server/services/trip-service";

import { PlannerWorkspaceShell } from "@/components/trip/planner-workspace-shell";
import { PlannerWorkspaceTabs } from "@/components/trip/planner-workspace-tabs";
import { TripLiveReport } from "@/components/trip/trip-live-report";
import { TripLogisticsBoard } from "@/components/trip/trip-logistics-board";
import { TripSnapshotHistoryTools } from "@/components/trip/trip-snapshot-history-tools";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

  const starterMode = isPlannerKickoffDraft({
    status: trip.status,
    currentStep: trip.currentStep,
    itineraryCount: trip.itinerary.length,
  });
  const createPlannerHref = plannerLimitState.canCreate
    ? "/dashboard?create=1"
    : billing.currentTier === "FREE"
      ? "/pricing"
      : "/billing";
  const plannerTabs = buildTripWorkspaceTabs(trips).map((tab) => ({
    ...tab,
    isActive: tab.id === trip.id,
  }));

  return (
    <PlannerWorkspaceShell
      currentTier={billing.currentTier}
      adminEnabled={adminEnabled}
      plannerTabs={plannerTabs}
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
    >
      {/* Keep the details surface separate from the chat-first Mara workspace so the conversation can stay clean. */}
      <div className="space-y-4">
        <Card tone="solid" className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Trip details</p>
              <p className="mt-1 text-sm text-[var(--muted)]">The live report and logistics keep updating here while you work with Mara.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard?tripId=${trip.id}`} className={buttonStyles({ variant: "secondary", size: "sm" })}>
                Open Mara
              </Link>
              {trip.itinerary.length ? (
                <Link href={`/trips/${trip.id}/itinerary`} className={buttonStyles({ variant: "ghost", size: "sm" })}>
                  Itinerary
                </Link>
              ) : null}
              {trip.status !== "DRAFT" ? (
                <Link href={`/trips/${trip.id}/live`} className={buttonStyles({ variant: "ghost", size: "sm" })}>
                  Live mode
                </Link>
              ) : null}
            </div>
          </div>
        </Card>

        <TripLiveReport
          tripId={trip.id}
          trip={trip}
          messages={trip.maraChatHistory}
          starterMode={starterMode}
          approximateLocation={approximateLocation?.label ?? null}
        />

        <section id="trip-logistics-board">
          <TripLogisticsBoard tripId={trip.id} />
        </section>

        <TripSnapshotHistoryTools tripId={trip.id} />
      </div>
    </PlannerWorkspaceShell>
  );
}
