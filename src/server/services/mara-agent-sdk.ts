import { Agent, Runner, assistant, user, type AgentInputItem } from "@openai/agents";

import type { TripPlannerChatMessage } from "@/lib/trip-planner-agent";

import type { PlannerContext } from "@/server/services/mara-agent-context";
import { buildMaraInstructions, buildPlannerContextBlock } from "@/server/services/mara-agent-prompt";

const DEFAULT_HIGH_VALUE_MARA_MODEL = "gpt-5-mini";
const DEFAULT_SPECIALIST_MARA_MODEL = "gpt-5-mini";
const MARA_MESSAGE_HISTORY_LIMIT = 8;

type StructuredConversationState = {
  latestUserRequest: string;
  recentUserContext: string;
  stablePlannerSummary: string;
  focusedTripSummary: string;
};

export type MaraRunContext = {
  plannerContext: PlannerContext;
  conversation: StructuredConversationState;
};

const maraRunner = new Runner({
  tracingDisabled: true,
  workflowName: "Parqara Mara planning workflow",
});

let cachedAgents:
  | {
      intake: Agent<MaraRunContext>;
      destination: Agent<MaraRunContext>;
      itinerary: Agent<MaraRunContext>;
      budget: Agent<MaraRunContext>;
      synthesis: Agent<MaraRunContext>;
    }
  | null = null;
let cachedHighValueModel: string | null = null;
let cachedSpecialistModel: string | null = null;

function getHighValueMaraModel() {
  return process.env.OPENAI_TRIP_PLANNER_MODEL || process.env.OPENAI_MODEL || DEFAULT_HIGH_VALUE_MARA_MODEL;
}

function getSpecialistMaraModel() {
  return process.env.OPENAI_TRIP_PLANNER_SPECIALIST_MODEL || getHighValueMaraModel() || DEFAULT_SPECIALIST_MARA_MODEL;
}

function createProfileIntakeAgent(model: string) {
  return new Agent<MaraRunContext>({
    name: "Profile Intake Agent",
    model,
    handoffDescription: "Extracts missing details, constraints, and decision points from the latest request.",
    instructions: (runContext) =>
      [
        "You are Mara's intake specialist.",
        "Turn the latest request into a compact planning brief for downstream specialists.",
        "Do not answer the user directly.",
        "Output short sections with bullets only: Known, Missing, Constraints, Immediate next step.",
        "If the focused trip already contains a needed detail, treat it as known instead of asking for it again.",
        "Stable planner context:",
        runContext.context.conversation.stablePlannerSummary,
      ].join("\n"),
  });
}

function createDestinationAgent(model: string) {
  return new Agent<MaraRunContext>({
    name: "Destination Research Agent",
    model,
    handoffDescription: "Handles destination and outing-shape recommendation work.",
    instructions: (runContext) =>
      [
        "You are Mara's destination specialist.",
        "Use the planning brief to suggest direction only when destination choice or scope is still open.",
        "Do not invent live hours, pricing, or reservation details.",
        "Do not write the final user-facing answer.",
        "Output short sections with bullets only: Best fit direction, Why it fits, What still needs confirmation.",
        "Stable planner context:",
        runContext.context.conversation.stablePlannerSummary,
      ].join("\n"),
  });
}

function createItineraryAgent(model: string) {
  return new Agent<MaraRunContext>({
    name: "Itinerary Agent",
    model,
    handoffDescription: "Shapes pacing, sequence, must-dos, and itinerary guidance.",
    instructions: (runContext) =>
      [
        "You are Mara's itinerary specialist.",
        "Focus on pacing, must-dos, route shape, and trip structure.",
        "Use the focused trip details before proposing changes.",
        "Do not write the final user-facing answer.",
        "Output short sections with bullets only: Route shape, Protected priorities, Risks, Suggested adjustment.",
        "Stable planner context:",
        runContext.context.conversation.stablePlannerSummary,
        "Focused trip summary:",
        runContext.context.conversation.focusedTripSummary,
      ].join("\n"),
  });
}

function createBudgetAgent(model: string) {
  return new Agent<MaraRunContext>({
    name: "Budget Agent",
    model,
    handoffDescription: "Provides lightweight budget framing and tradeoff notes.",
    instructions: (runContext) =>
      [
        "You are Mara's budget specialist.",
        "Focus on practical budget framing and tradeoffs, not exact live pricing.",
        "Do not write the final user-facing answer.",
        "Output short sections with bullets only: Budget range, Biggest cost drivers, Save vs splurge guidance.",
        "Stable planner context:",
        runContext.context.conversation.stablePlannerSummary,
      ].join("\n"),
  });
}

function createSynthesisAgent(model: string) {
  return new Agent<MaraRunContext>({
    name: "Final Synthesis Agent",
    model,
    handoffDescription: "Turns specialist notes back into Mara's user-facing response.",
    instructions: (runContext) =>
      [
        buildMaraInstructions(runContext.context.plannerContext),
        "You are the only user-facing speaker in this workflow.",
        "Use the specialist notes you receive to produce the final answer in Mara's voice.",
        "Do not mention internal agents, tools, orchestration, or specialist handoffs.",
      ].join("\n\n"),
  });
}

function getAgents() {
  const highValueModel = getHighValueMaraModel();
  const specialistModel = getSpecialistMaraModel();

  if (!cachedAgents || cachedHighValueModel !== highValueModel || cachedSpecialistModel !== specialistModel) {
    cachedAgents = {
      intake: createProfileIntakeAgent(specialistModel),
      destination: createDestinationAgent(specialistModel),
      itinerary: createItineraryAgent(highValueModel),
      budget: createBudgetAgent(specialistModel),
      synthesis: createSynthesisAgent(highValueModel),
    };
    cachedHighValueModel = highValueModel;
    cachedSpecialistModel = specialistModel;
  }

  return cachedAgents;
}

function buildConversationState(plannerContext: PlannerContext, messages: TripPlannerChatMessage[]): StructuredConversationState {
  const recentUserMessages = messages.filter((message) => message.role === "user").slice(-3);
  const latestUserRequest = recentUserMessages.at(-1)?.content.trim() || "Help me shape this trip.";
  const recentUserContext = recentUserMessages.map((message) => `- ${message.content.trim()}`).join("\n") || "- No additional user context yet.";
  const focusedTripSummary = plannerContext.focusedTrip
    ? [
        `${plannerContext.focusedTrip.name} at ${plannerContext.focusedTrip.parkName} on ${plannerContext.focusedTrip.visitDate}`,
        `Status: ${plannerContext.focusedTrip.status}`,
        `Party: ${plannerContext.focusedTrip.partySize} guest${plannerContext.focusedTrip.partySize === 1 ? "" : "s"}`,
        `Itinerary preview: ${plannerContext.focusedTrip.itineraryPreview.length ? plannerContext.focusedTrip.itineraryPreview.join(" -> ") : "No itinerary yet"}`,
      ].join("\n")
    : "No focused trip is attached.";

  return {
    latestUserRequest,
    recentUserContext,
    stablePlannerSummary: buildPlannerContextBlock(plannerContext),
    focusedTripSummary,
  };
}

function shouldRunDestinationAgent(plannerContext: PlannerContext, latestUserRequest: string) {
  if (!plannerContext.focusedTrip) {
    return true;
  }

  return /destination|where|which park|which city|where should/i.test(latestUserRequest);
}

function shouldRunBudgetAgent(plannerContext: PlannerContext, latestUserRequest: string) {
  if (/budget|cost|price|save|splurge|expensive|cheap/i.test(latestUserRequest)) {
    return true;
  }

  return Boolean(plannerContext.budgetPreference?.trim());
}

async function runTextAgent(agent: Agent<MaraRunContext>, prompt: string, context: MaraRunContext) {
  const result = await maraRunner.run(agent, [user(prompt)], {
    context,
    maxTurns: 1,
  });

  if (typeof result.finalOutput !== "string") {
    return null;
  }

  const trimmed = result.finalOutput.trim();
  return trimmed || null;
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
  const conversation = buildConversationState(plannerContext, messages);
  const runContext: MaraRunContext = {
    plannerContext,
    conversation,
  };
  const agents = getAgents();

  const intakeSummary =
    (await runTextAgent(
      agents.intake,
      [
        `Latest user request:\n${conversation.latestUserRequest}`,
        `Recent user context:\n${conversation.recentUserContext}`,
        "Summarize the planning brief for the next specialists.",
      ].join("\n\n"),
      runContext
    )) || "Known\n- The user wants help shaping this trip.\nMissing\n- Specific missing fields still need to be clarified.\nConstraints\n- Use saved trip details first.\nImmediate next step\n- Ask for the most important missing detail only if it is required.";

  const destinationSummary = shouldRunDestinationAgent(plannerContext, conversation.latestUserRequest)
    ? (await runTextAgent(
        agents.destination,
        [
          `Latest user request:\n${conversation.latestUserRequest}`,
          `Intake summary:\n${intakeSummary}`,
          "Only give destination or scope guidance if it is actually needed.",
        ].join("\n\n"),
        runContext
      )) || "Best fit direction\n- No separate destination guidance is needed."
    : "Best fit direction\n- No separate destination guidance is needed.";

  const itinerarySummary =
    (await runTextAgent(
      agents.itinerary,
      [
        `Latest user request:\n${conversation.latestUserRequest}`,
        `Intake summary:\n${intakeSummary}`,
        "Focus on pacing, priorities, and the next version of the plan.",
      ].join("\n\n"),
      runContext
    )) || "Route shape\n- Keep the plan readable and protect the top priorities first.";

  const budgetSummary = shouldRunBudgetAgent(plannerContext, conversation.latestUserRequest)
    ? (await runTextAgent(
        agents.budget,
        [
          `Latest user request:\n${conversation.latestUserRequest}`,
          `Intake summary:\n${intakeSummary}`,
          "Give only practical budget framing. Avoid pretending to know live pricing.",
        ].join("\n\n"),
        runContext
      )) || "Budget range\n- Budget detail is not the main decision in this turn."
    : "Budget range\n- Budget detail is not the main decision in this turn.";

  return runTextAgent(
    agents.synthesis,
    [
      `Latest user request:\n${conversation.latestUserRequest}`,
      `Recent user context:\n${conversation.recentUserContext}`,
      `Intake summary:\n${intakeSummary}`,
      `Destination summary:\n${destinationSummary}`,
      `Itinerary summary:\n${itinerarySummary}`,
      `Budget summary:\n${budgetSummary}`,
      "Write Mara's final answer now.",
    ].join("\n\n"),
    runContext
  );
}
