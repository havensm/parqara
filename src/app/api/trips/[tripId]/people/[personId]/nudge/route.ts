import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { getAppOrigin } from "@/lib/auth/google";
import { tripPersonReminderSchema } from "@/lib/validation/trip-person";
import { sendTripPersonReminder } from "@/server/services/trip-people-service";

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string; personId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = tripPersonReminderSchema.parse(await request.json());
    const { tripId, personId } = await params;
    return NextResponse.json(await sendTripPersonReminder(user.id, tripId, personId, body, getAppOrigin(request)));
  } catch (error) {
    return apiError(error);
  }
}
