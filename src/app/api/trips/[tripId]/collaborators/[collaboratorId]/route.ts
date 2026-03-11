import { NextResponse } from "next/server";

import { apiError, requireApiFeatureAccess, requireApiUser } from "@/app/api/_utils";
import { removeTripCollaborator } from "@/server/services/trip-service";

export async function DELETE(_: Request, { params }: { params: Promise<{ tripId: string; collaboratorId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    requireApiFeatureAccess(user, "tripCollaboration");

    const { tripId, collaboratorId } = await params;
    const state = await removeTripCollaborator(user.id, tripId, collaboratorId);
    return NextResponse.json(state);
  } catch (error) {
    return apiError(error);
  }
}
