import {
  TRIP_PLANNER_PERSONA,
  formatTripPlannerStatusLabel,
  type TripPlannerChatMessage,
} from "@/lib/trip-planner-agent";

import type { PlannerContext } from "@/server/services/mara-agent-context";
import { buildInteractivePromptFallbackLead, buildTripPlannerInteractivePrompt } from "@/server/services/trip-planner-interactive-prompt";

function formatPlannerValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Not set";
}

function formatPlannerList(values: string[]) {
  return values.length ? values.map((value) => value.replaceAll("-", " ")).join(", ") : "Not set";
}

function getLogisticsValues(context: PlannerContext) {
  return {
    plannerAccessRole: context.plannerAccessRole ?? "EDIT",
    logisticsScopedToViewer: Boolean(context.logisticsScopedToViewer),
    logisticsRosterSummary: context.logisticsRosterSummary ?? [],
    logisticsTaskSummary: context.logisticsTaskSummary ?? [],
    viewerTaskSummary: context.viewerTaskSummary ?? [],
  };
}

export function buildPlannerContextBlock(context: PlannerContext) {
  const logistics = getLogisticsValues(context);
  const lines = [
    `Planner defaults summary: ${context.summaryItems.length ? context.summaryItems.join(" | ") : "No short summary saved yet."}`,
    `Top planning priorities: ${formatPlannerList(context.planningPriorities)}`,
    `Planning style: ${formatPlannerValue(context.planningStyle)}`,
    `Budget preference: ${formatPlannerValue(context.budgetPreference)}`,
    `Travel distance preference: ${formatPlannerValue(context.travelDistancePreference)}`,
    `Preferred planning help level: ${formatPlannerValue(context.planningHelpLevel)}`,
    `Dietary preferences: ${formatPlannerList(context.dietaryPreferences)}`,
    `Accessibility needs: ${formatPlannerList(context.accessibilityNeeds)}`,
    `Additional notes: ${formatPlannerValue(context.additionalNotes)}`,
    `Planner access: ${logistics.plannerAccessRole}`,
    `Logistics scope: ${logistics.logisticsScopedToViewer ? "Viewer-only logistics" : "Shared trip logistics"}`,
    `Trip roster: ${logistics.logisticsRosterSummary.length ? logistics.logisticsRosterSummary.join("; ") : "No trip roster saved yet."}`,
    `Visible logistics tasks: ${logistics.logisticsTaskSummary.length ? logistics.logisticsTaskSummary.join("; ") : "No logistics tasks saved yet."}`,
  ];

  if (logistics.logisticsScopedToViewer) {
    lines.push(`Viewer task list: ${logistics.viewerTaskSummary.length ? logistics.viewerTaskSummary.join("; ") : "No assigned tasks yet."}`);
  }

  if (context.focusedTrip) {
    lines.push(`Focused trip: ${context.focusedTrip.name} at ${context.focusedTrip.parkName} on ${context.focusedTrip.visitDate} (${formatTripPlannerStatusLabel(context.focusedTrip.status)})`);
    lines.push(`Focused trip summary: ${formatPlannerValue(context.focusedTrip.latestPlanSummary)}`);
    lines.push(`Focused trip starting location: ${formatPlannerValue(context.focusedTrip.startingLocation)}`);
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
    lines.push(`Focused trip ride preferences: ${formatPlannerList(context.focusedTrip.preferredRideTypes)}`);
    lines.push(`Focused trip dining preferences: ${formatPlannerList(context.focusedTrip.diningPreferences)}`);
    lines.push(`Focused trip setup step: ${context.focusedTrip.currentStep}`);

    if (context.focusedTrip.itineraryPreview.length) {
      lines.push(`Focused trip itinerary preview: ${context.focusedTrip.itineraryPreview.join(" -> ")}`);
    }
  }

  if (context.recentTrips.length) {
    lines.push(`Recent trips: ${context.recentTrips.map((trip) => `${trip.name} at ${trip.parkName} (${trip.status})`).join("; ")}`);
  }

  return lines.join("\n");
}

export function buildMaraInstructions(context: PlannerContext) {
  const logistics = getLogisticsValues(context);

  return [
    `You are ${TRIP_PLANNER_PERSONA.name}, Parqara's ${TRIP_PLANNER_PERSONA.title}.`,
    "You sound warm, observant, practical, and quietly confident.",
    "You should feel like a real travel advisor who already understands the trip, not a generic AI assistant, workflow bot, or concierge script.",
    "Your job is to help the user plan outings such as theme park days, zoo trips, beach days, city outings, and weekend getaways.",
    "Use the saved profile context below as defaults, but say when you are making an assumption.",
    "If a focused trip is attached, treat that trip as the default subject of the conversation and use its saved details before asking for information already present.",
    logistics.logisticsScopedToViewer
      ? "This user is not acting as a shared planner editor. Help only with the logistics and trip prep visible to them. Do not reassign group work or speak as if you can rewrite the whole shared plan."
      : "If the trip involves multiple people, you can suggest shared prep work, likely assignees, and missing logistics that the organizer should track.",
    "When travel or group logistics are implied, call out practical follow-through such as ID, flights, PTO, gear, lodging, or shared reminders.",
    "Before giving a full recommendation, gather the missing essentials gradually instead of running a full intake all at once.",
    "Ask one question at a time when possible. Only ask two together when they are tightly connected and easy to answer in one reply.",
    "When you need a missing detail, prefer crisp questions that fit quick choices or a short typed answer, like close to home vs willing to travel, today vs weekend vs later, solo vs couple vs family vs group, or a starting address.",
    "Default to natural short paragraphs that read like a real travel agent talking to one person.",
    "Use bullets only when comparing options, listing prep items, or recapping a plan the user can act on.",
    "Do not overexplain or narrate your process.",
    "Do not repeat the same trip detail twice in one reply.",
    "Do not restate the trip name, date, or known basics unless it materially helps the next decision.",
    "If you are asking a follow-up question, keep the lead-in to one short sentence at most.",
    "Never invent live park hours, ticket prices, restaurant availability, or reservation windows. If live verification would be needed, say so clearly.",
    "Keep answers concise and actionable, usually under 120 words unless the user asks for more depth.",
    "If the user is vague, lead with the next best one or two details instead of generic travel tips or a long checklist.",
    "Saved profile context:",
    buildPlannerContextBlock(context),
  ].join("\n");
}

function buildFullFallbackReply(context: PlannerContext, messages: TripPlannerChatMessage[]) {
  const logistics = getLogisticsValues(context);
  const userMessages = messages.filter((message) => message.role === "user");
  const interactivePrompt = buildTripPlannerInteractivePrompt(context, messages);
  const followUpQuestion = buildInteractivePromptFallbackLead(interactivePrompt);
  const defaultSummary = context.summaryItems.length ? context.summaryItems.join(", ") : "no saved planning defaults yet";
  if (context.focusedTrip && logistics.logisticsScopedToViewer) {
    if (userMessages.length <= 1) {
      return [
        `I'm looking at your part of the trip to ${context.focusedTrip.parkName}.`,
        logistics.viewerTaskSummary.length ? `Your tasks right now: ${logistics.viewerTaskSummary.join(", ")}.` : "You don't have any assigned tasks yet.",
        followUpQuestion ?? "Tell me which task you want help with first.",
      ].join("\n");
    }

    return [
      `I'm keeping this scoped to your part of the ${context.focusedTrip.parkName} trip.`,
      logistics.viewerTaskSummary.length ? `Right now I can see: ${logistics.viewerTaskSummary.join(", ")}.` : "There's still no assigned prep on your side.",
      followUpQuestion ?? "Tell me which task you want to solve right now.",
    ].join("\n");
  }

  if (followUpQuestion && userMessages.length <= 1) {
    return [
      "That sounds like a good start.",
      followUpQuestion,
      interactivePrompt?.helper ?? "Give me this one detail and I will keep shaping the plan.",
    ].join("\n");
  }

  if (context.focusedTrip) {
    if (userMessages.length <= 1) {
      return [
        context.focusedTrip.latestPlanSummary
          ? `Current note: ${context.focusedTrip.latestPlanSummary}`
          : "I can use the trip details you've already saved.",
        logistics.logisticsTaskSummary.length
          ? `Shared prep on the board: ${logistics.logisticsTaskSummary.slice(0, 3).join("; ")}.`
          : "There's no prep pinned yet.",
        followUpQuestion ?? "Tell me what you want to shape first: trip details, pacing, or prep work.",
      ].join("\n");
    }

    return [
      logistics.logisticsTaskSummary.length
        ? `I can see shared prep already on the board: ${logistics.logisticsTaskSummary.slice(0, 3).join("; ")}.`
        : "Shared prep still needs to be shaped.",
      defaultSummary !== "no saved planning defaults yet" ? `I'm still keeping your usual planning style in mind: ${defaultSummary}.` : "",
      followUpQuestion ?? "Tell me what you want to change next.",
    ].filter(Boolean).join("\n");
  }

  if (userMessages.length <= 1) {
    return [
      `I can help turn this into a usable plan.`,
      followUpQuestion ?? "Start with where you want to go and when it's happening.",
      defaultSummary !== "no saved planning defaults yet" ? `I'll keep your usual style in mind: ${defaultSummary}.` : "",
    ].filter(Boolean).join("\n");
  }

  return [
    "I have enough to start shaping this.",
    defaultSummary !== "no saved planning defaults yet" ? `I'm keeping your usual planning style in mind: ${defaultSummary}.` : "",
    followUpQuestion ?? "Send the destination and timing first, and I'll narrow the next detail from there.",
  ].filter(Boolean).join("\n");
}

export function buildFallbackReply(context: PlannerContext, messages: TripPlannerChatMessage[]) {
  return buildFullFallbackReply(context, messages);
}


