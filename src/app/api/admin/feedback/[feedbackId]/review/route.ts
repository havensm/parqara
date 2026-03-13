import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { isAdminEmail } from "@/lib/admin";
import { markFeedbackReviewed } from "@/server/services/feedback-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { feedbackId } = await params;
    return NextResponse.json(await markFeedbackReviewed(feedbackId));
  } catch (error) {
    return apiError(error);
  }
}
