import { NextResponse } from "next/server";

import { apiError, requireApiFeatureAccess, requireApiUser } from "@/app/api/_utils";
import { replanTrip } from "@/server/services/trip-service";

export async function POST(_: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    requireApiFeatureAccess(user, "liveReplan");

    const { tripId } = await params;
    const trip = await replanTrip(user.id, tripId);
    return NextResponse.json(trip);
  } catch (error) {
    return apiError(error);
  }
}
