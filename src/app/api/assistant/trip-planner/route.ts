import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { getUserBillingState } from "@/lib/billing";
import { tripPlannerChatRequestSchema } from "@/lib/trip-planner-agent";
import { reserveMaraUsage, rollbackMaraUsageReservation } from "@/server/services/mara-rate-limit-service";
import { generateTripPlannerReply } from "@/server/services/trip-planner-agent";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = tripPlannerChatRequestSchema.parse(await request.json());
    const billing = getUserBillingState(user);
    const hasFullAccess = billing.featureAccess.aiConcierge;
    const reservation = await reserveMaraUsage({
      userId: user.id,
      currentTier: billing.currentTier,
      hasFullAccess,
    });

    try {
      const reply = await generateTripPlannerReply(user.id, body.messages, body.tripId);

      if (hasFullAccess) {
        return NextResponse.json({
          reply,
          fullAccess: true,
        });
      }

      const updatedBilling = getUserBillingState({
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        maraPreviewRepliesUsed: reservation.maraPreviewRepliesUsed,
      });

      return NextResponse.json({
        reply,
        fullAccess: false,
        usedStarterReplies: updatedBilling.maraStarterPreview.usedReplies,
        remainingStarterReplies: updatedBilling.maraStarterPreview.remainingReplies,
        starterReplyLimit: updatedBilling.maraStarterPreview.replyLimit,
      });
    } catch (error) {
      // Failed AI calls still count against the rate limit, but free/plus users should not lose starter credits.
      await rollbackMaraUsageReservation({
        userId: user.id,
        hadStarterReplyReservation: reservation.hadStarterReplyReservation,
      });
      throw error;
    }
  } catch (error) {
    return apiError(error);
  }
}
