import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { removePendingUserPersonInvite } from "@/server/services/user-service";

export async function DELETE(_: Request, { params }: { params: Promise<{ inviteId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteId } = await params;
    return NextResponse.json(await removePendingUserPersonInvite(user.id, inviteId));
  } catch (error) {
    return apiError(error);
  }
}
