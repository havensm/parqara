import type { TripPlannerInteractivePromptDto, TripPlannerInteractiveOptionDto } from "@/lib/contracts";
import type { TripPlannerChatMessage } from "@/lib/trip-planner-agent";
import type { PlannerContext } from "@/server/services/mara-agent-context";

function getUserText(messages: TripPlannerChatMessage[]) {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ")
    .trim();
}

function buildOption(label: string, value: string, sendAs = value): TripPlannerInteractiveOptionDto {
  return { label, value, sendAs };
}

function isStarterDraft(context: PlannerContext) {
  return Boolean(
    context.focusedTrip &&
      context.focusedTrip.status === "DRAFT" &&
      context.focusedTrip.currentStep === 0 &&
      context.focusedTrip.itineraryPreview.length === 0
  );
}

function hasTravelScope(userText: string) {
  return /close to home|nearby|local|willing to travel|travel for it|road trip|fly|flying|drive a few hours|worth traveling/i.test(userText);
}

function hasTiming(userText: string) {
  return /today|tonight|tomorrow|this weekend|weekend|next week|next month|later this month|later this year|\b\d+\s*(day|days|night|nights|week|weeks)\b|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(
    userText
  );
}

function hasGroupInfo(userText: string, context: PlannerContext) {
  if (/just me|solo|date night|couple|family|kids|with \d+|group trip|friends|other people|adults/i.test(userText)) {
    return true;
  }

  if (!isStarterDraft(context) && context.focusedTrip) {
    return context.focusedTrip.partySize > 1 || context.focusedTrip.kidsAges.length > 0;
  }

  return false;
}

function hasStartingLocation(userText: string, context: PlannerContext) {
  if (/start from|leaving from|coming from|we live in|i live in|from\s+[A-Z0-9]/.test(userText)) {
    return true;
  }

  return Boolean(context.focusedTrip?.startingLocation?.trim());
}

function hasPriorityCue(userText: string) {
  return /must[- ]do|priority|priorities|budget|cheap|easy|low[- ]stress|family[- ]friendly|food|pace/i.test(userText);
}

function isGenericOutingIdea(userText: string) {
  return /\bzoo\b|aquarium|museum|beach|park day|theme park|water park|hike|cabin|camping|road trip|date night|weekend getaway/i.test(userText);
}

function buildTravelScopePrompt(): TripPlannerInteractivePromptDto {
  return {
    id: "travel-scope",
    kind: "SINGLE_SELECT",
    prompt: "Should this stay close to home, or are you open to traveling for it?",
    helper: "I can shape this differently if it needs to be nearby versus worth a bigger trip.",
    field: "travelDistancePreference",
    placeholder: null,
    submitLabel: null,
    autoComplete: null,
    options: [
      buildOption("Close to home", "close_to_home", "Keep this close to home."),
      buildOption("Open to travel", "open_to_travel", "We are willing to travel for this."),
      buildOption("Not sure yet", "not_sure", "I am not sure yet how far we want to go."),
    ],
    suggestions: [],
  };
}

function buildTimingPrompt(): TripPlannerInteractivePromptDto {
  return {
    id: "timing",
    kind: "SELECT",
    prompt: "When is this happening?",
    helper: "A rough timing window is enough. Mara can tighten the rest after that.",
    field: "duration",
    placeholder: null,
    submitLabel: "Use timing",
    autoComplete: null,
    options: [
      buildOption("Today / tonight", "today", "This is happening today or tonight."),
      buildOption("This weekend", "this_weekend", "This is for this weekend."),
      buildOption("Soon, date not locked", "soon", "This is happening soon, but the exact date is not locked yet."),
      buildOption("It is a bigger trip later", "later_trip", "This is a bigger trip later, not right away."),
    ],
    suggestions: [],
  };
}

function buildGroupPrompt(): TripPlannerInteractivePromptDto {
  return {
    id: "group",
    kind: "SINGLE_SELECT",
    prompt: "Who is this for?",
    helper: "I will tune the pace, logistics, and prep work around the group.",
    field: "groupSummary",
    placeholder: null,
    submitLabel: null,
    autoComplete: null,
    options: [
      buildOption("Just me", "solo", "This is just for me."),
      buildOption("Two adults", "two_adults", "This is for two adults."),
      buildOption("Family", "family", "This is a family trip."),
      buildOption("Group", "group", "This is a group trip with several people."),
    ],
    suggestions: [],
  };
}

function buildLocationPrompt(context: PlannerContext): TripPlannerInteractivePromptDto {
  const suggestions = [
    context.focusedTrip?.startingLocation ?? null,
    context.focusedTrip?.parkName ? `${context.focusedTrip.parkName} area` : null,
    "Home address",
    "Hotel or lodging",
    "Neighborhood or part of town",
  ].filter((value, index, array): value is string => Boolean(value && array.indexOf(value) === index));

  return {
    id: "starting-location",
    kind: "ADDRESS",
    prompt: "What address or neighborhood should I plan from?",
    helper: "This helps Mara map travel time, pacing, and where the day should start.",
    field: "startingLocation",
    placeholder: "Enter a starting address or neighborhood",
    submitLabel: "Use starting point",
    autoComplete: "street-address",
    options: [],
    suggestions,
  };
}

function buildPriorityPrompt(): TripPlannerInteractivePromptDto {
  return {
    id: "priorities",
    kind: "SINGLE_SELECT",
    prompt: "What matters most for this plan?",
    helper: "Pick the one thing Mara should protect first.",
    field: "latestTakeaway",
    placeholder: null,
    submitLabel: null,
    autoComplete: null,
    options: [
      buildOption("Keep it easy", "easy", "Keep the pace easy and low stress."),
      buildOption("Hit the highlights", "highlights", "Make sure we hit the main must-dos."),
      buildOption("Stay on budget", "budget", "Keep the plan budget-friendly."),
      buildOption("Make it family-friendly", "family_friendly", "Keep it family-friendly and easy for the group."),
    ],
    suggestions: [],
  };
}

export function buildTripPlannerInteractivePrompt(
  context: PlannerContext,
  messages: TripPlannerChatMessage[]
): TripPlannerInteractivePromptDto | null {
  const userText = getUserText(messages);
  const starterDraft = isStarterDraft(context);

  if (!userText) {
    return {
      id: "plan-shape",
      kind: "SINGLE_SELECT",
      prompt: "What kind of plan are you starting?",
      helper: "Start simple. Mara will ask for the next detail after this.",
      field: "destination",
      placeholder: null,
      submitLabel: null,
      autoComplete: null,
      options: [
        buildOption("Zoo trip", "zoo_trip", "I want to plan a zoo trip."),
        buildOption("Night out", "night_out", "I want to plan a night out."),
        buildOption("Family outing", "family_outing", "I want to plan a family outing."),
        buildOption("Weekend trip", "weekend_trip", "I want to plan a weekend trip."),
      ],
      suggestions: [],
    };
  }

  if ((starterDraft || !context.focusedTrip?.latestPlanSummary) && isGenericOutingIdea(userText) && !hasTravelScope(userText)) {
    return buildTravelScopePrompt();
  }

  if (starterDraft && !hasTiming(userText)) {
    return buildTimingPrompt();
  }

  if (starterDraft && !hasGroupInfo(userText, context)) {
    return buildGroupPrompt();
  }

  if (!hasStartingLocation(userText, context)) {
    return buildLocationPrompt(context);
  }

  if (!hasPriorityCue(userText)) {
    return buildPriorityPrompt();
  }

  return null;
}

export function buildInteractivePromptFallbackLead(prompt: TripPlannerInteractivePromptDto | null) {
  if (!prompt) {
    return null;
  }

  return prompt.prompt;
}
