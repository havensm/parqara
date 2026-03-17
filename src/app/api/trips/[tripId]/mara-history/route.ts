import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { clearTripMaraChatHistory } from "@/server/services/trip-service";

export async function DELETE(_request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId } = await params;
    await clearTripMaraChatHistory(user.id, tripId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
