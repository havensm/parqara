import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { getPlanByTier, getUserBillingState } from "@/lib/billing";
import { tripPlannerChatRequestSchema } from "@/lib/trip-planner-agent";
import { generateTripPlannerReply } from "@/server/services/trip-planner-agent";
import { recordMaraStarterReply } from "@/server/services/user-service";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = tripPlannerChatRequestSchema.parse(await request.json());
    const billing = getUserBillingState(user);
    const hasFullAccess = billing.featureAccess.aiConcierge;

    if (!hasFullAccess && !billing.maraStarterPreview.canSend) {
      return NextResponse.json(
        {
          error: `You have used the ${billing.maraStarterPreview.replyLimit} Mara starter replies included on ${getPlanByTier(billing.currentTier).name}. Upgrade to Pro to keep planning with Mara.`,
          usedStarterReplies: billing.maraStarterPreview.usedReplies,
          remainingStarterReplies: billing.maraStarterPreview.remainingReplies,
          starterReplyLimit: billing.maraStarterPreview.replyLimit,
        },
        { status: 402 }
      );
    }

    const reply = await generateTripPlannerReply(user.id, body.messages, body.tripId);

    if (hasFullAccess) {
      return NextResponse.json({
        reply,
        fullAccess: true,
      });
    }

    const updatedUsage = await recordMaraStarterReply(user.id);
    const updatedBilling = getUserBillingState({
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      maraPreviewRepliesUsed: updatedUsage.maraPreviewRepliesUsed,
    });

    return NextResponse.json({
      reply,
      fullAccess: false,
      usedStarterReplies: updatedBilling.maraStarterPreview.usedReplies,
      remainingStarterReplies: updatedBilling.maraStarterPreview.remainingReplies,
      starterReplyLimit: updatedBilling.maraStarterPreview.replyLimit,
    });
  } catch (error) {
    return apiError(error);
  }
}
