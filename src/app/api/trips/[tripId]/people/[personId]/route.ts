import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { tripPersonUpdateSchema } from "@/lib/validation/trip-person";
import { removeTripPerson, updateTripPerson } from "@/server/services/trip-people-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ tripId: string; personId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = tripPersonUpdateSchema.parse(await request.json());
    const { tripId, personId } = await params;
    return NextResponse.json(await updateTripPerson(user.id, tripId, personId, body));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ tripId: string; personId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId, personId } = await params;
    return NextResponse.json(await removeTripPerson(user.id, tripId, personId));
  } catch (error) {
    return apiError(error);
  }
}
