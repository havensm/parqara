import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { tripUpdateSchema } from "@/lib/validation/trip";
import { getTripDetail, updateTrip } from "@/server/services/trip-service";

export async function GET(_: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId } = await params;
    const trip = await getTripDetail(user.id, tripId);
    return NextResponse.json(trip);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = tripUpdateSchema.parse(await request.json());
    const { tripId } = await params;
    const trip = await updateTrip(user.id, tripId, body);
    return NextResponse.json(trip);
  } catch (error) {
    return apiError(error);
  }
}
