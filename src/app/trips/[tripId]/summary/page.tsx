import { requireCompletedOnboardingUser } from "@/lib/auth/guards";
import { getTripSummary } from "@/server/services/trip-service";

import { SummaryView } from "@/components/trip/summary-view";

export default async function TripSummaryPage({ params }: { params: Promise<{ tripId: string }> }) {
  const user = await requireCompletedOnboardingUser();
  const { tripId } = await params;
  const summary = await getTripSummary(user.id, tripId);

  return <SummaryView summary={summary} />;
}
