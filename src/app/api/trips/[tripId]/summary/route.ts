import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { getTripSummary } from "@/server/services/trip-service";

export async function GET(_: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId } = await params;
    const summary = await getTripSummary(user.id, tripId);
    return NextResponse.json(summary);
  } catch (error) {
    return apiError(error);
  }
}
