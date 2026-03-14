import type { TripPlannerChatMessage } from "@/lib/trip-planner-agent";

import { getPlannerContext } from "@/server/services/mara-agent-context";
import { buildFallbackReply, type MaraReplyMode } from "@/server/services/mara-agent-prompt";
import { runMaraAgent } from "@/server/services/mara-agent-sdk";

export async function generateTripPlannerReply(
  userId: string,
  messages: TripPlannerChatMessage[],
  tripId?: string,
  options: { replyMode?: MaraReplyMode } = {}
) {
  const context = await getPlannerContext(userId, tripId);
  const replyMode = options.replyMode ?? "full";

  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackReply(context, messages, replyMode);
  }

  try {
    const reply = await runMaraAgent(context, messages, replyMode);
    return reply || buildFallbackReply(context, messages, replyMode);
  } catch {
    return buildFallbackReply(context, messages, replyMode);
  }
}
