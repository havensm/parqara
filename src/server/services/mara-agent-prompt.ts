import {
  TRIP_PLANNER_PERSONA,
  formatTripPlannerStatusLabel,
  type TripPlannerChatMessage,
} from "@/lib/trip-planner-agent";

import type { PlannerContext } from "@/server/services/mara-agent-context";

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
    "You sound warm, observant, practical, and quietly confident. You are never chirpy, flippant, or salesy.",
    "Your job is to help the user plan outings such as theme park days, zoo trips, beach days, city outings, and weekend getaways.",
    "Use the saved profile context below as defaults, but say when you are making an assumption.",
    "If a focused trip is attached, treat that trip as the default subject of the conversation and use its saved details before asking for information already present.",
    logistics.logisticsScopedToViewer
      ? "This user is not acting as a shared planner editor. Help only with the logistics and trip prep visible to them. Do not reassign group work or speak as if you can rewrite the whole shared plan."
      : "If the trip involves multiple people, you can suggest shared prep work, likely assignees, and missing logistics that the organizer should track.",
    "When travel or group logistics are implied, call out practical follow-through such as ID, flights, PTO, gear, lodging, or shared reminders.",
    "Before giving a full recommendation, gather the missing essentials gradually instead of running a full intake all at once.",
    "Ask one question at a time when possible. Only ask two together when they are tightly connected and easy to answer in one reply.",
    "Once you have enough information, respond with short sections using bullets: Trip brief, Suggested plan, Watch-outs, Next decision.",
    "Never invent live park hours, ticket prices, restaurant availability, or reservation windows. If live verification would be needed, say so clearly.",
    "Keep answers concise and actionable, usually under 220 words unless the user asks for more depth.",
    "If the user is vague, lead with the next best one or two details instead of generic travel tips or a long checklist.",
    "Saved profile context:",
    buildPlannerContextBlock(context),
  ].join("\n");
}

function buildFullFallbackReply(context: PlannerContext, messages: TripPlannerChatMessage[]) {
  const logistics = getLogisticsValues(context);
  const userMessages = messages.filter((message) => message.role === "user");
  const defaultSummary = context.summaryItems.length ? context.summaryItems.join(", ") : "no saved planning defaults yet";
  const recentTripSummary = context.recentTrips.length
    ? `Recent trip context: ${context.recentTrips.map((trip) => `${trip.name} (${trip.status})`).join(", ")}.`
    : "You do not have recent trips saved yet.";

  if (context.focusedTrip && logistics.logisticsScopedToViewer) {
    const taskList = logistics.viewerTaskSummary.length ? logistics.viewerTaskSummary.map((task) => `- ${task}`).join("\n") : "- No assigned logistics yet.";

    if (userMessages.length <= 1) {
      return [
        `I'm already looking at ${context.focusedTrip.name}.`,
        "Your part of the trip is scoped here so I can help with what you need to handle.",
        "Assigned tasks",
        taskList,
        "Next decision",
        "- Tell me which task you want help with first, or tell me what still feels unclear.",
      ].join("\n");
    }

    return [
      `I'm keeping ${context.focusedTrip.name} as the active trip and focusing on your part of it.`,
      "Trip brief",
      `- Planner defaults still lean toward ${defaultSummary}.`,
      `- Your visible prep work: ${logistics.viewerTaskSummary.length ? logistics.viewerTaskSummary.join(", ") : "Nothing assigned yet"}.`,
      "Suggested plan",
      "- Work one assigned task at a time so nothing slips.",
      "- Ask me for the next concrete step and I'll keep it scoped to your part of the trip.",
      "Watch-outs",
      "- I won't act like I can reassign the whole group's work from this view.",
      "Next decision",
      "- Tell me which task you want to solve right now.",
    ].join("\n");
  }

  if (context.focusedTrip) {
    if (userMessages.length <= 1) {
      return [
        `I'm already looking at ${context.focusedTrip.name} at ${context.focusedTrip.parkName} on ${context.focusedTrip.visitDate}.`,
        `This trip is currently ${formatTripPlannerStatusLabel(context.focusedTrip.status).toLowerCase()}.`,
        context.focusedTrip.latestPlanSummary
          ? `Current note: ${context.focusedTrip.latestPlanSummary}`
          : "I can use the saved trip details as context even before the itinerary is finalized.",
        logistics.logisticsTaskSummary.length
          ? `Shared prep already on the board: ${logistics.logisticsTaskSummary.slice(0, 4).join("; ")}.`
          : "No logistics have been saved yet, so I can help surface what the group still needs.",
        "Tell me which direction you want:",
        "- fill in missing trip details",
        "- tighten the pace for this group",
        "- split up the prep work",
        "- review what should change before you lock the plan",
      ].join("\n");
    }

    return [
      `I'm treating ${context.focusedTrip.name} as the active trip and using its saved details as context.`,
      "Trip brief",
      `- Saved defaults still lean toward ${defaultSummary}.`,
      `- Focused trip status: ${formatTripPlannerStatusLabel(context.focusedTrip.status)}.`,
      logistics.logisticsTaskSummary.length ? `- Shared logistics already saved: ${logistics.logisticsTaskSummary.slice(0, 5).join("; ")}.` : "- Shared logistics still need to be shaped.",
      "Suggested plan",
      "- Tighten the remaining missing details or adjust the itinerary around the group's pacing needs.",
      "- If this is a group trip, start pinning prep like IDs, flights, gear, PTO, or lodging to the right people.",
      "Watch-outs",
      "- Do not rely on live hours, prices, or availability until they are checked.",
      "Next decision",
      "- Tell me what you want to change or what follow-through you want me to surface next.",
    ].join("\n");
  }

  if (userMessages.length <= 1) {
    return [
      `I'm ${TRIP_PLANNER_PERSONA.name}, and I can help turn this into a usable plan.`,
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

export function buildFallbackReply(context: PlannerContext, messages: TripPlannerChatMessage[]) {
  return buildFullFallbackReply(context, messages);
}
