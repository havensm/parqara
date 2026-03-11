import { NextResponse } from "next/server";

import { apiError, requireApiFeatureAccess, requireApiUser } from "@/app/api/_utils";
import { tripCollaboratorInviteSchema } from "@/lib/validation/trip-collaborator";
import { addTripCollaborator, getTripCollaboratorState } from "@/server/services/trip-service";

export async function GET(_: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    requireApiFeatureAccess(user, "tripCollaboration");

    const { tripId } = await params;
    const state = await getTripCollaboratorState(user.id, tripId);
    return NextResponse.json(state);
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

    requireApiFeatureAccess(user, "tripCollaboration");

    const body = tripCollaboratorInviteSchema.parse(await request.json());
    const { tripId } = await params;
    const state = await addTripCollaborator(user.id, tripId, body.email);
    return NextResponse.json(state, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
