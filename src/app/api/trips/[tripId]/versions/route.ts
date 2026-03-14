import { NextResponse } from "next/server";

import { apiError, requireApiFeatureAccess, requireApiUser } from "@/app/api/_utils";
import { listPlannerVersions } from "@/server/services/trip-service";

export async function GET(_: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    requireApiFeatureAccess(user, "versionHistory");

    const { tripId } = await params;
    const versions = await listPlannerVersions(user.id, tripId);
    return NextResponse.json({ versions });
  } catch (error) {
    return apiError(error);
  }
}
