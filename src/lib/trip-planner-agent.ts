import { z } from "zod";

import type { TripDetailDto, TripStatusValue } from "@/lib/contracts";

export const TRIP_PLANNER_PERSONA = {
  name: "Mara",
  title: "Trip Planning Concierge",
  description: "A calm, observant trip strategist who turns rough ideas into clear, workable plans.",
  voice: "Warm, composed, and quietly decisive.",
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
const TRIP_PLANNER_MAX_MESSAGE_LENGTH = 2_000;
const TRIP_PLANNER_MAX_TOTAL_CHARS = 6_000;

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
    questions.push("What are the top rides, shows, or food stops you want this trip to protect?");
  }

  if (!trip.partyProfile.preferredRideTypes.length) {
    questions.push("What kind of attractions should this plan lean toward?");
  }

  if (!trip.partyProfile.diningPreferences.length) {
    questions.push("Any food preferences, budget notes, or must-have stops I should work around?");
  }

  if (!trip.partyProfile.kidsAges.length && trip.partyProfile.partySize > 1) {
    questions.push("Will kids be part of this group, and if so what are their ages?");
  }

  if (!trip.partyProfile.breakStart || !trip.partyProfile.breakEnd) {
    questions.push("Should I protect a break or slower window in the middle of the day?");
  }

  if (questions.length) {
    return questions.slice(0, 2);
  }

  if (trip.status === "DRAFT") {
    return [
      `Review ${trip.name} and ask me the next one or two details you still need before planning the route.`,
    ];
  }

  if (trip.itinerary.length) {
    return ["Check this plan for pacing, walking, and wait-time tradeoffs."];
  }

  return ["Review this planner and tell me the next one or two details you still need."];
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
  tripId: z.string().trim().min(1).max(200).optional(),
});
export const tripPlannerStarterPrompts = [
  "I want to plan an adventure. Ask me the first one or two details you need.",
  "I want to go somewhere fun this weekend. Help me narrow it down.",
  "Help me plan a low-stress day for my group around food and must-dos.",
  "I know where I want to go. Ask me the next one or two details you need.",
] as const;

export const tripPlannerTripStarterPrompts = [
  "Review this trip and tell me what details are still missing.",
  "Use this trip and ask me the next one or two details you need.",
  "Tell me what you would change to make this trip lower stress.",
  "Pressure-test this trip against my saved preferences.",
] as const;

export function getTripPlannerStarterPrompts(tripContext?: TripPlannerTripContext) {
  return tripContext ? tripPlannerTripStarterPrompts : tripPlannerStarterPrompts;
}

export function buildTripPlannerWelcomeMessage(firstName?: string | null, tripContext?: TripPlannerTripContext) {
  const greeting = firstName?.trim() ? `Hi ${firstName}.` : "Hi.";

  if (tripContext) {
    return [
      `${greeting} I'm Mara, your Parqara trip strategist.`,
      `I'm already looking at ${tripContext.name} at ${tripContext.parkName} on ${tripContext.visitDate}.`,
      `This trip is currently ${formatTripPlannerStatusLabel(tripContext.status).toLowerCase()}, and I can use its saved details as context.`,
      "Tell me what feels off, what changed, or what you want to protect, and I'll help reshape the plan.",
    ].join("\n");
  }

  return [
    `${greeting} I'm Mara, your Parqara trip strategist.`,
    "Give me the rough idea and I'll turn it into a clear trip brief.",
    "Start with where you want to go, when it is happening, or what matters most for the day.",
    "If you are not sure yet, I can ask the next one or two details and narrow it with you.",
  ].join("\n");
}


