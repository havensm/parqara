import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { restoreTrip } from "@/server/services/trip-service";

export async function POST(_: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId } = await params;
    const result = await restoreTrip(user.id, tripId);
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
