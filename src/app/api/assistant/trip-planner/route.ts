import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { getUserBillingState } from "@/lib/billing";
import { tripPlannerChatRequestSchema } from "@/lib/trip-planner-agent";
import { reserveMaraUsage } from "@/server/services/mara-rate-limit-service";
import { generateTripPlannerReply } from "@/server/services/trip-planner-agent";
import { saveTripMaraChatHistory } from "@/server/services/trip-service";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = tripPlannerChatRequestSchema.parse(await request.json());
    const billing = getUserBillingState(user);
    await reserveMaraUsage({
      userId: user.id,
      currentTier: billing.currentTier,
    });

    const result = await generateTripPlannerReply(user.id, body.messages, body.tripId);
    const resolvedMessages = [...body.messages, { role: "assistant" as const, content: result.reply }];

    await saveTripMaraChatHistory(user.id, body.tripId, resolvedMessages).catch(() => undefined);

    return NextResponse.json({
      reply: result.reply,
      snapshotProposal: result.snapshotProposal,
      interactivePrompt: result.interactivePrompt,
      fullAccess: true,
    });
  } catch (error) {
    return apiError(error);
  }
}
