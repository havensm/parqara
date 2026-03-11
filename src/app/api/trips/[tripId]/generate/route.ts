import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { generateTripItinerary } from "@/server/services/trip-service";

export async function POST(_: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId } = await params;
    const trip = await generateTripItinerary(user.id, tripId);
    return NextResponse.json(trip);
  } catch (error) {
    return apiError(error);
  }
}
