import type { TripPlannerChatMessage } from "@/lib/trip-planner-agent";

import { getPlannerContext } from "@/server/services/mara-agent-context";
import { buildFallbackReply } from "@/server/services/mara-agent-prompt";
import { runMaraAgent } from "@/server/services/mara-agent-sdk";

const MARA_REPLY_TIMEOUT_MS = 18000;

async function runMaraAgentWithTimeout(context: Awaited<ReturnType<typeof getPlannerContext>>, messages: TripPlannerChatMessage[]) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const agentPromise = runMaraAgent(context, messages).catch(() => null);
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutHandle = setTimeout(() => resolve(null), MARA_REPLY_TIMEOUT_MS);
  });

  try {
    return await Promise.race([agentPromise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export async function generateTripPlannerReply(userId: string, messages: TripPlannerChatMessage[], tripId: string) {
  const context = await getPlannerContext(userId, tripId);

  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackReply(context, messages);
  }

  try {
    const reply = await runMaraAgentWithTimeout(context, messages);
    return reply || buildFallbackReply(context, messages);
  } catch {
    return buildFallbackReply(context, messages);
  }
}
