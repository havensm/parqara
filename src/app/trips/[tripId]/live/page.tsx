import { canAccessBillingFeature, getUserBillingState } from "@/lib/billing";
import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import { getLiveDashboard, getTripDetail } from "@/server/services/trip-service";

import { LiveDashboard } from "@/components/dashboard/live-dashboard";
import { LiveDashboardPreview } from "@/components/dashboard/live-dashboard-preview";

export default async function LiveTripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const user = await requireCompletedOnboardingUser();
  const billing = getUserBillingState(user);
  const { tripId } = await params;

  if (!canAccessBillingFeature(billing.currentTier, "liveDashboard")) {
    const trip = await getTripDetail(user.id, tripId);
    return <LiveDashboardPreview trip={trip} currentTier={billing.currentTier} />;
  }

  const liveState = await getLiveDashboard(user.id, tripId);
  return <LiveDashboard initialState={liveState} />;
}
