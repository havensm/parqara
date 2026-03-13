import OpenAI from "openai";

import type { TripStatusValue } from "@/lib/contracts";
import { buildPreferenceSummary } from "@/lib/onboarding";
import {
  TRIP_PLANNER_PERSONA,
  formatTripPlannerStatusLabel,
  type TripPlannerChatMessage,
} from "@/lib/trip-planner-agent";
import { getTripDetail, listDashboardTrips } from "@/server/services/trip-service";
import { getOnboardingState, getUserWithPreference } from "@/server/services/user-service";

type PlannerContext = {
  firstName: string | null;
  summaryItems: string[];
  planningPriorities: string[];
  planningStyle: string;
  budgetPreference: string;
  travelDistancePreference: string;
  planningHelpLevel: string;
  dietaryPreferences: string[];
  accessibilityNeeds: string[];
  additionalNotes: string;
  recentTrips: Array<{
    name: string;
    parkName: string;
    status: TripStatusValue;
    latestPlanSummary: string | null;
  }>;
  focusedTrip: {
    name: string;
    parkName: string;
    status: TripStatusValue;
    visitDate: string;
    latestPlanSummary: string | null;
    partySize: number;
    kidsAges: number[];
    thrillTolerance: string;
    walkingTolerance: string;
    preferredRideTypes: string[];
    diningPreferences: string[];
    startTime: string;
    breakStart: string | null;
    breakEnd: string | null;
    itineraryPreview: string[];
    currentStep: number;
  } | null;
};

function formatValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Not set";
}

function formatList(values: string[]) {
  return values.length ? values.map((value) => value.replaceAll("-", " ")).join(", ") : "Not set";
}

async function getPlannerContext(userId: string, tripId?: string): Promise<PlannerContext> {
  const [user, onboarding, recentTrips, focusedTrip] = await Promise.all([
    getUserWithPreference(userId),
    getOnboardingState(userId),
    listDashboardTrips(userId),
    tripId ? getTripDetail(userId, tripId) : Promise.resolve(null),
  ]);

  return {
    firstName: user.firstName,
    summaryItems: buildPreferenceSummary(onboarding.values),
    planningPriorities: onboarding.values.planningPriorities,
    planningStyle: onboarding.values.planningStyle,
    budgetPreference: onboarding.values.budgetPreference,
    travelDistancePreference: onboarding.values.travelDistancePreference,
    planningHelpLevel: onboarding.values.planningHelpLevel,
    dietaryPreferences: onboarding.values.dietaryPreferences,
    accessibilityNeeds: onboarding.values.accessibilityNeeds,
    additionalNotes: onboarding.values.additionalNotes,
    recentTrips: recentTrips.slice(0, 3).map((trip) => ({
      name: trip.name,
      parkName: trip.parkName,
      status: trip.status,
      latestPlanSummary: trip.latestPlanSummary,
    })),
    focusedTrip: focusedTrip
      ? {
          name: focusedTrip.name,
          parkName: focusedTrip.park.name,
          status: focusedTrip.status,
          visitDate: focusedTrip.visitDate,
          latestPlanSummary: focusedTrip.latestPlanSummary,
          partySize: focusedTrip.partyProfile.partySize,
          kidsAges: focusedTrip.partyProfile.kidsAges,
          thrillTolerance: focusedTrip.partyProfile.thrillTolerance,
          walkingTolerance: focusedTrip.partyProfile.walkingTolerance,
          preferredRideTypes: focusedTrip.partyProfile.preferredRideTypes,
          diningPreferences: focusedTrip.partyProfile.diningPreferences,
          startTime: focusedTrip.partyProfile.startTime,
          breakStart: focusedTrip.partyProfile.breakStart,
          breakEnd: focusedTrip.partyProfile.breakEnd,
          itineraryPreview: focusedTrip.itinerary.slice(0, 5).map((item) => item.title),
          currentStep: focusedTrip.currentStep,
        }
      : null,
  };
}

function buildContextBlock(context: PlannerContext) {
  const lines = [
    `Planner defaults summary: ${context.summaryItems.length ? context.summaryItems.join(" | ") : "No short summary saved yet."}`,
    `Top planning priorities: ${formatList(context.planningPriorities)}`,
    `Planning style: ${formatValue(context.planningStyle)}`,
    `Budget preference: ${formatValue(context.budgetPreference)}`,
    `Travel distance preference: ${formatValue(context.travelDistancePreference)}`,
    `Preferred planning help level: ${formatValue(context.planningHelpLevel)}`,
    `Dietary preferences: ${formatList(context.dietaryPreferences)}`,
    `Accessibility needs: ${formatList(context.accessibilityNeeds)}`,
    `Additional notes: ${formatValue(context.additionalNotes)}`,
  ];

  if (context.focusedTrip) {
    lines.push(`Focused trip: ${context.focusedTrip.name} at ${context.focusedTrip.parkName} on ${context.focusedTrip.visitDate} (${formatTripPlannerStatusLabel(context.focusedTrip.status)})`);
    lines.push(`Focused trip summary: ${formatValue(context.focusedTrip.latestPlanSummary)}`);
    lines.push(
      `Focused trip party: ${context.focusedTrip.partySize} guest${context.focusedTrip.partySize === 1 ? "" : "s"}${
        context.focusedTrip.kidsAges.length ? `, kids ages ${context.focusedTrip.kidsAges.join(", ")}` : ""
      }`
    );
    lines.push(`Focused trip arrival time: ${context.focusedTrip.startTime}`);
    lines.push(
      `Focused trip break window: ${
        context.focusedTrip.breakStart && context.focusedTrip.breakEnd
          ? `${context.focusedTrip.breakStart} to ${context.focusedTrip.breakEnd}`
          : "None saved"
      }`
    );
    lines.push(`Focused trip thrill tolerance: ${context.focusedTrip.thrillTolerance}`);
    lines.push(`Focused trip walking tolerance: ${context.focusedTrip.walkingTolerance}`);
    lines.push(`Focused trip ride preferences: ${formatList(context.focusedTrip.preferredRideTypes)}`);
    lines.push(`Focused trip dining preferences: ${formatList(context.focusedTrip.diningPreferences)}`);
    lines.push(`Focused trip setup step: ${context.focusedTrip.currentStep}`);

    if (context.focusedTrip.itineraryPreview.length) {
      lines.push(`Focused trip itinerary preview: ${context.focusedTrip.itineraryPreview.join(" -> ")}`);
    }
  }

  if (context.recentTrips.length) {
    lines.push(
      `Recent trips: ${context.recentTrips
        .map((trip) => `${trip.name} at ${trip.parkName} (${trip.status})`)
        .join("; ")}`
    );
  }

  return lines.join("\n");
}

function buildSystemPrompt(context: PlannerContext) {
  return [
    `You are ${TRIP_PLANNER_PERSONA.name}, Parqara's ${TRIP_PLANNER_PERSONA.title}.`,
    "You sound warm, observant, practical, and quietly confident. You are never chirpy, flippant, or salesy.",
    "Your job is to help the user plan outings such as theme park days, zoo trips, beach days, city outings, and weekend getaways.",
    "Use the saved profile context below as defaults, but say when you are making an assumption.",
    "If a focused trip is attached, treat that trip as the default subject of the conversation and use its saved details before asking for information already present.",
    "Before giving a full recommendation, gather the missing essentials gradually instead of running a full intake all at once.",
    "Ask one question at a time when possible. Only ask two together when they are tightly connected and easy to answer in one reply.",
    "Once you have enough information, respond with short sections using bullets: Trip brief, Suggested plan, Watch-outs, Next decision.",
    "Never invent live park hours, ticket prices, restaurant availability, or reservation windows. If live verification would be needed, say so clearly.",
    "Keep answers concise and actionable, usually under 220 words unless the user asks for more depth.",
    "If the user is vague, lead with the next best one or two details instead of generic travel tips or a long checklist.",
    "Saved profile context:",
    buildContextBlock(context),
  ].join("\n");
}

function buildFallbackReply(context: PlannerContext, messages: TripPlannerChatMessage[]) {
  const userMessages = messages.filter((message) => message.role === "user");
  const defaultSummary = context.summaryItems.length ? context.summaryItems.join(", ") : "no saved planning defaults yet";
  const recentTripSummary = context.recentTrips.length
    ? `Recent trip context: ${context.recentTrips.map((trip) => `${trip.name} (${trip.status})`).join(", ")}.`
    : "You do not have recent trips saved yet.";

  if (context.focusedTrip) {
    if (userMessages.length <= 1) {
      return [
        `I’m already looking at ${context.focusedTrip.name} at ${context.focusedTrip.parkName} on ${context.focusedTrip.visitDate}.`,
        `This trip is currently ${formatTripPlannerStatusLabel(context.focusedTrip.status).toLowerCase()}.`,
        context.focusedTrip.latestPlanSummary ? `Current note: ${context.focusedTrip.latestPlanSummary}` : "I can use the saved trip details as context even before the itinerary is finalized.",
        "Tell me which direction you want:",
        "- fill in missing trip details",
        "- tighten the pace for this group",
        "- change must-dos, food, or break timing",
        "- review what should change before you lock the plan",
      ].join("\n");
    }

    return [
      `I’m treating ${context.focusedTrip.name} as the active trip and using its saved details as context.`,
      "Trip brief",
      `- Saved defaults still lean toward ${defaultSummary}.`,
      `- Focused trip status: ${formatTripPlannerStatusLabel(context.focusedTrip.status)}.`,
      "Suggested plan",
      "- Tighten the remaining missing details or adjust the itinerary around the group’s pacing needs.",
      "- Keep the destination, date, and must-dos stable unless something important changed.",
      "Watch-outs",
      "- Do not rely on live hours, prices, or availability until they are checked.",
      "Next decision",
      "- Tell me what you want to change on this trip and I will focus the next step there.",
    ].join("\n");
  }

  if (userMessages.length <= 1) {
    return [
      `I’m ${TRIP_PLANNER_PERSONA.name}, and I can help turn this into a usable plan.`,
      `I already know your saved profile leans toward ${defaultSummary}.`,
      recentTripSummary,
      "Start with just these two details:",
      "- where you want to go",
      "- when it is happening",
      "I will ask for the next details after that.",
    ].join("\n");
  }

  return [
    "I have enough to start shaping this, but I still want to avoid bad assumptions.",
    "Trip brief",
    `- Planning style default: ${defaultSummary}.`,
    "Suggested plan",
    "- Narrow the destination, date window, and group needs first.",
    "- Then lock the top 3 must-dos so the rest of the day can flex around them.",
    "Watch-outs",
    "- Do not rely on exact hours, prices, or availability until they are checked live.",
    "Next decision",
    "- Send the destination and timing first, and I will ask for the next one or two details after that.",
  ].join("\n");
}

class OpenAITripPlannerAgent {
  private readonly client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  private readonly model = process.env.OPENAI_TRIP_PLANNER_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini";

  async reply(context: PlannerContext, messages: TripPlannerChatMessage[]) {
    try {
      const response = await this.client.responses.create({
        model: this.model,
        input: [
          {
            role: "system",
            content: buildSystemPrompt(context),
          },
          ...messages.slice(-12).map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
      });

      return response.output_text.trim() || buildFallbackReply(context, messages);
    } catch {
      return buildFallbackReply(context, messages);
    }
  }
}

export async function generateTripPlannerReply(userId: string, messages: TripPlannerChatMessage[], tripId?: string) {
  const context = await getPlannerContext(userId, tripId);

  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackReply(context, messages);
  }

  const agent = new OpenAITripPlannerAgent();
  return agent.reply(context, messages);
}



