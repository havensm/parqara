import { NextResponse } from "next/server";

import { apiError, requireApiFeatureAccess, requireApiUser } from "@/app/api/_utils";
import { removeTripCollaboratorInvite } from "@/server/services/trip-service";

export async function DELETE(_: Request, { params }: { params: Promise<{ tripId: string; inviteId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    requireApiFeatureAccess(user, "tripCollaboration");

    const { tripId, inviteId } = await params;
    const state = await removeTripCollaboratorInvite(user.id, tripId, inviteId);
    return NextResponse.json(state);
  } catch (error) {
    return apiError(error);
  }
}
