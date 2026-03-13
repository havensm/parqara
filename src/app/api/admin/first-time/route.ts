import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { isAdminEmail } from "@/lib/admin";
import { resetFirstTimeWalkthrough } from "@/server/services/user-service";

export async function POST() {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await resetFirstTimeWalkthrough(user.id);
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
