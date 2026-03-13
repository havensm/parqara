import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { markNotificationRead } from "@/server/services/notification-service";

export async function POST(_: Request, { params }: { params: Promise<{ notificationId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId } = await params;
    const result = await markNotificationRead(user.id, notificationId);
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
