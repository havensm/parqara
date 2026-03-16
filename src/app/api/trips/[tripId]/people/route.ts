import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { getAppOrigin } from "@/lib/auth/google";
import { tripPersonCreateSchema } from "@/lib/validation/trip-person";
import { addTripPerson, getTripPeopleState } from "@/server/services/trip-people-service";

export async function GET(_: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId } = await params;
    return NextResponse.json(await getTripPeopleState(user.id, tripId));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = tripPersonCreateSchema.parse(await request.json());
    const { tripId } = await params;
    return NextResponse.json(await addTripPerson(user.id, tripId, body, getAppOrigin(request)), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
