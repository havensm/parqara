import { Agent, Runner, assistant, user, type AgentInputItem } from "@openai/agents";

import type { TripPlannerChatMessage } from "@/lib/trip-planner-agent";

import type { PlannerContext } from "@/server/services/mara-agent-context";
import { buildMaraInstructions } from "@/server/services/mara-agent-prompt";

const DEFAULT_MARA_MODEL = "gpt-5-mini";
const MARA_MESSAGE_HISTORY_LIMIT = 12;

export type MaraRunContext = {
  plannerContext: PlannerContext;
};

const maraRunner = new Runner({
  tracingDisabled: true,
  workflowName: "Parqara Mara chat",
});

let cachedAgent: Agent<MaraRunContext> | null = null;
let cachedModel: string | null = null;

function getMaraModel() {
  return process.env.OPENAI_TRIP_PLANNER_MODEL || process.env.OPENAI_MODEL || DEFAULT_MARA_MODEL;
}

function createMaraAgent(model: string) {
  return new Agent<MaraRunContext>({
    name: "Mara",
    model,
    handoffDescription: "Parqara's trip planning concierge for shaping trips and reviewing tradeoffs.",
    instructions: (runContext) => buildMaraInstructions(runContext.context.plannerContext),
  });
}

function getMaraAgent() {
  const model = getMaraModel();

  if (!cachedAgent || cachedModel !== model) {
    cachedAgent = createMaraAgent(model);
    cachedModel = model;
  }

  return cachedAgent;
}

export function mapTripPlannerMessagesToAgentInputItems(messages: TripPlannerChatMessage[]): AgentInputItem[] {
  return messages.slice(-MARA_MESSAGE_HISTORY_LIMIT).map((message) => {
    if (message.role === "assistant") {
      return assistant(message.content);
    }

    return user(message.content);
  });
}

export async function runMaraAgent(plannerContext: PlannerContext, messages: TripPlannerChatMessage[]) {
  const result = await maraRunner.run(getMaraAgent(), mapTripPlannerMessagesToAgentInputItems(messages), {
    context: { plannerContext },
    maxTurns: 1,
  });

  if (typeof result.finalOutput !== "string") {
    return null;
  }

  const trimmed = result.finalOutput.trim();
  return trimmed || null;
}
