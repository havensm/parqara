import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { tripSetupSchema } from "@/lib/validation/trip";
import { createTrip } from "@/server/services/trip-service";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = tripSetupSchema.parse(await request.json());
    const trip = await createTrip(user.id, body);
    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
