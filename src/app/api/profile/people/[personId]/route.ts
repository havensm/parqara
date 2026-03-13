import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { removeUserPerson } from "@/server/services/user-service";

export async function DELETE(_: Request, { params }: { params: Promise<{ personId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { personId } = await params;
    return NextResponse.json(await removeUserPerson(user.id, personId));
  } catch (error) {
    return apiError(error);
  }
}
