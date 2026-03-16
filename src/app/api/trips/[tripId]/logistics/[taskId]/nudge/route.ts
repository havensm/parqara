import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { getAppOrigin } from "@/lib/auth/google";
import { tripLogisticsReminderSchema } from "@/lib/validation/trip-logistics";
import { sendTripLogisticsTaskReminder } from "@/server/services/trip-people-service";

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string; taskId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = tripLogisticsReminderSchema.parse(await request.json());
    const { tripId, taskId } = await params;
    return NextResponse.json(await sendTripLogisticsTaskReminder(user.id, tripId, taskId, body, getAppOrigin(request)));
  } catch (error) {
    return apiError(error);
  }
}
