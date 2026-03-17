import type {
  TripLiveSnapshotProposalDto,
  TripPlannerInteractivePromptDto,
} from "@/lib/contracts";
import type { TripPlannerChatMessage } from "@/lib/trip-planner-agent";

import { getPlannerContext } from "@/server/services/mara-agent-context";
import { buildFallbackReply } from "@/server/services/mara-agent-prompt";
import { buildTripPlannerInteractivePrompt } from "@/server/services/trip-planner-interactive-prompt";
import { buildTripLiveSnapshotProposalState } from "@/server/services/trip-live-snapshot-service";
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

export async function generateTripPlannerReply(
  userId: string,
  messages: TripPlannerChatMessage[],
  tripId: string
): Promise<{ reply: string; snapshotProposal: TripLiveSnapshotProposalDto | null; interactivePrompt: TripPlannerInteractivePromptDto | null }> {
  const context = await getPlannerContext(userId, tripId);

  let reply = buildFallbackReply(context, messages);

  if (process.env.OPENAI_API_KEY) {
    try {
      const agentReply = await runMaraAgentWithTimeout(context, messages);
      if (agentReply) {
        reply = agentReply;
      }
    } catch {
      reply = buildFallbackReply(context, messages);
    }
  }

  const snapshotProposal = await buildTripLiveSnapshotProposalState(userId, tripId, messages, reply).catch(() => null);
  const interactivePrompt = buildTripPlannerInteractivePrompt(context, messages);

  return {
    reply,
    snapshotProposal,
    interactivePrompt,
  };
}
