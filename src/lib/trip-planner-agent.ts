import { z } from "zod";

import type { TripDetailDto, TripStatusValue } from "@/lib/contracts";

export const TRIP_PLANNER_PERSONA = {
  name: "Mara",
  title: "Trip Planning Concierge",
  description: "A calm planning partner who turns rough ideas into easy, usable plans.",
  voice: "Warm, clear, and quietly adventurous.",
  personality: [
    "Pulls structure out of fuzzy ideas fast.",
    "Explains tradeoffs without making the plan feel heavy.",
    "Protects pacing, comfort, and must-dos at the same time.",
  ],
  approach: [
    "Clarify the outing, timing, group, and must-dos before recommending a plan.",
    "Use saved profile defaults as helpful context, but call out assumptions clearly.",
    "Balance pace, budget, kid-fit, food, and comfort instead of over-optimizing one thing.",
  ],
} as const;

export type TripPlannerChatRole = "assistant" | "user";

export type TripPlannerChatMessage = {
  role: TripPlannerChatRole;
  content: string;
};

export type TripPlannerTripContext = {
  id: string;
  name: string;
  parkName: string;
  status: TripStatusValue;
  visitDate: string;
  summary: string | null;
  detailTags: string[];
};

const TRIP_PLANNER_MAX_MESSAGES = 24;
const TRIP_PLANNER_MAX_MESSAGE_LENGTH = 1_200;
const TRIP_PLANNER_MAX_TOTAL_CHARS = 4_000;

function formatTripDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatTripPlannerStatusLabel(status: TripStatusValue) {
  switch (status) {
    case "DRAFT":
      return "Being planned";
    case "PLANNED":
      return "Planned";
    case "LIVE":
      return "Live";
    case "COMPLETED":
      return "Completed";
    default:
      return status;
  }
}

export function buildTripPlannerTripContext(
  trip: Pick<TripDetailDto, "id" | "name" | "status" | "visitDate" | "latestPlanSummary" | "park" | "partyProfile" | "itinerary">
): TripPlannerTripContext {
  const detailTags = [
    `${trip.partyProfile.partySize} ${trip.partyProfile.partySize === 1 ? "guest" : "guests"}`,
    `Arrive ${trip.partyProfile.startTime}`,
    trip.itinerary.length ? `${trip.itinerary.length} planned ${trip.itinerary.length === 1 ? "stop" : "stops"}` : "Draft details saved",
  ];

  if (trip.partyProfile.breakStart && trip.partyProfile.breakEnd) {
    detailTags.push(`Break ${trip.partyProfile.breakStart}-${trip.partyProfile.breakEnd}`);
  }

  return {
    id: trip.id,
    name: trip.name,
    parkName: trip.park.name,
    status: trip.status,
    visitDate: formatTripDate(trip.visitDate),
    summary: trip.latestPlanSummary,
    detailTags,
  };
}

export function buildTripPlannerNeededQuestions(
  trip: Pick<TripDetailDto, "status" | "name" | "partyProfile" | "park" | "itinerary">
) {
  const questions: string[] = [];

  if (!trip.partyProfile.mustDoRideIds.length) {
    questions.push("What matters most?");
  }

  if (!trip.partyProfile.preferredRideTypes.length) {
    questions.push("What kind of day do you want?");
  }

  if (!trip.partyProfile.diningPreferences.length) {
    questions.push("Any food or budget guardrails?");
  }

  if (!trip.partyProfile.kidsAges.length && trip.partyProfile.partySize > 1) {
    questions.push("Any kids in the group?");
  }

  if (!trip.partyProfile.breakStart || !trip.partyProfile.breakEnd) {
    questions.push("Want a slower stretch or break?");
  }

  if (questions.length) {
    return questions.slice(0, 2);
  }

  if (trip.status === "DRAFT") {
    return [`Review ${trip.name} and tell me what is still missing.`];
  }

  if (trip.itinerary.length) {
    return ["What would you change first?"];
  }

  return ["What is still missing?"];
}

export const tripPlannerChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["assistant", "user"]),
        content: z.string().trim().min(1).max(TRIP_PLANNER_MAX_MESSAGE_LENGTH),
      })
    )
    .min(1)
    .max(TRIP_PLANNER_MAX_MESSAGES)
    .superRefine((messages, context) => {
      const totalChars = messages.reduce((sum, message) => sum + message.content.length, 0);

      if (totalChars > TRIP_PLANNER_MAX_TOTAL_CHARS) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Keep the full Mara prompt under ${TRIP_PLANNER_MAX_TOTAL_CHARS.toLocaleString()} characters.`,
        });
      }
    }),
  tripId: z.string().trim().min(1).max(200),
});

export const tripPlannerStarterPrompts = [
  "Help me plan something fun this weekend.",
  "Help me shape a low-stress day with good food and a few must-dos.",
  "I know where I want to go. Help me shape the plan.",
  "I just have the rough idea. Help me narrow it down.",
] as const;

export const tripPlannerTripStarterPrompts = [
  "What would you change first?",
  "Help me make this day feel easier.",
  "Check this against my saved preferences.",
  "Show me what this plan is missing.",
] as const;

export function getTripPlannerStarterPrompts(tripContext?: TripPlannerTripContext) {
  return tripContext ? tripPlannerTripStarterPrompts : tripPlannerStarterPrompts;
}

export function buildTripPlannerWelcomeMessage(firstName?: string | null, tripContext?: TripPlannerTripContext) {
  const greeting = firstName?.trim() ? `Hi ${firstName}.` : "Hi.";

  if (tripContext) {
    return [
      `${greeting} I'm looking at ${tripContext.name}.`,
      `${tripContext.parkName} · ${tripContext.visitDate}`,
      "Tell me what to change, protect, or figure out next.",
    ].join("\n");
  }

  return [`${greeting} Open a planner and I will work from that trip.`].join("\n");
}
