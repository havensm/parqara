import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { createFeedbackEntry } from "@/server/services/feedback-service";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    return NextResponse.json(await createFeedbackEntry(user.id, body), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
