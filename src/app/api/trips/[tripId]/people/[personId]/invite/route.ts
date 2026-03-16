import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { getAppOrigin } from "@/lib/auth/google";
import { resendTripPersonInvite } from "@/server/services/trip-people-service";

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string; personId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId, personId } = await params;
    return NextResponse.json(await resendTripPersonInvite(user.id, tripId, personId, getAppOrigin(request)));
  } catch (error) {
    return apiError(error);
  }
}
