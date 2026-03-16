import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { revertTripLiveSnapshot } from "@/server/services/trip-live-snapshot-service";

export async function POST(_request: Request, { params }: { params: Promise<{ tripId: string; revisionId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId, revisionId } = await params;
    const state = await revertTripLiveSnapshot(user.id, tripId, revisionId);
    return NextResponse.json(state);
  } catch (error) {
    return apiError(error);
  }
}
