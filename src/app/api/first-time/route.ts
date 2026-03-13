import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { completeFirstTimeWalkthrough } from "@/server/services/user-service";

export async function POST() {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await completeFirstTimeWalkthrough(user.id);
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
