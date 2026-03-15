import type { TripPlannerChatMessage } from "@/lib/trip-planner-agent";

import { getPlannerContext } from "@/server/services/mara-agent-context";
import { buildFallbackReply } from "@/server/services/mara-agent-prompt";
import { runMaraAgent } from "@/server/services/mara-agent-sdk";

export async function generateTripPlannerReply(userId: string, messages: TripPlannerChatMessage[], tripId: string) {
  const context = await getPlannerContext(userId, tripId);

  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackReply(context, messages);
  }

  try {
    const reply = await runMaraAgent(context, messages);
    return reply || buildFallbackReply(context, messages);
  } catch {
    return buildFallbackReply(context, messages);
  }
}
