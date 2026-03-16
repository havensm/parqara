import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { tripLogisticsUpdateSchema } from "@/lib/validation/trip-logistics";
import { deleteTripLogisticsTask, updateTripLogisticsTask } from "@/server/services/trip-people-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ tripId: string; taskId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = tripLogisticsUpdateSchema.parse(await request.json());
    const { tripId, taskId } = await params;
    return NextResponse.json(await updateTripLogisticsTask(user.id, tripId, taskId, body));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ tripId: string; taskId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId, taskId } = await params;
    return NextResponse.json(await deleteTripLogisticsTask(user.id, tripId, taskId));
  } catch (error) {
    return apiError(error);
  }
}
