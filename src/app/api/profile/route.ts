import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { getOnboardingState, updateProfileSettings } from "@/server/services/user-service";

export async function GET() {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      ...(await getOnboardingState(user.id)),
      profileImageDataUrl: user.profileImageDataUrl ?? null,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    return NextResponse.json(await updateProfileSettings(user.id, body));
  } catch (error) {
    return apiError(error);
  }
}
