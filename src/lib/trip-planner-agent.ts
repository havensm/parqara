import { z } from "zod";

import type { TripDetailDto, TripStatusValue } from "@/lib/contracts";

export const TRIP_PLANNER_PERSONA = {
  name: "Mara",
  title: "Trip Planning Concierge",
  description: "A calm, detail-oriented trip strategist who asks practical questions and turns rough ideas into workable plans.",
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
  const questions = [`Review ${trip.name} and tell me what details are still missing.`];

  if (trip.status === "DRAFT") {
    questions.push("Ask me the next two questions you need so this trip can be planned properly.");
  }

  if (!trip.partyProfile.mustDoRideIds.length) {
    questions.push("What are the must-do rides, shows, or food stops for this trip?");
  }

  if (!trip.partyProfile.preferredRideTypes.length) {
    questions.push("What kind of attractions should this plan lean toward?");
  }

  if (!trip.partyProfile.diningPreferences.length) {
    questions.push("Any dining preferences, budget notes, or must-have food stops?");
  }

  if (!trip.partyProfile.kidsAges.length && trip.partyProfile.partySize > 1) {
    questions.push("Will kids be part of this group, and if so what are their ages?");
  }

  if (!trip.partyProfile.breakStart || !trip.partyProfile.breakEnd) {
    questions.push("Should I protect a break or lower-energy window in the middle of the day?");
  }

  if (trip.status !== "DRAFT" && trip.itinerary.length) {
    questions.push("Check this plan for walking, pacing, and wait-time tradeoffs.");
  }

  return Array.from(new Set(questions)).slice(0, 4);
}

export const tripPlannerChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["assistant", "user"]),
        content: z.string().trim().min(1).max(2_000),
      })
    )
    .min(1)
    .max(24),
  tripId: z.string().trim().min(1).max(200).optional(),
});

export const tripPlannerStarterPrompts = [
  "Help me plan a kid-friendly theme park day.",
  "Ask me the right questions before I book a weekend getaway.",
  "Build a relaxed day trip plan around food and low stress.",
  "Compare two outing ideas and tell me which fits my style better.",
] as const;

export const tripPlannerTripStarterPrompts = [
  "Review this trip and tell me what details are still missing.",
  "Use this trip and ask me the next two questions you need answered.",
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
      `${greeting} I am ${TRIP_PLANNER_PERSONA.name}, your Parqara ${TRIP_PLANNER_PERSONA.title.toLowerCase()}.`,
      `I am already looking at ${tripContext.name} at ${tripContext.parkName} on ${tripContext.visitDate}.`,
      `This trip is currently ${formatTripPlannerStatusLabel(tripContext.status).toLowerCase()}, and I can use its saved details as context.`,
      "Tell me if you want to fill gaps, tighten the plan, stress-test the pacing, or change priorities for this specific trip.",
    ].join("\n");
  }

  return [
    `${greeting} I am ${TRIP_PLANNER_PERSONA.name}, your Parqara ${TRIP_PLANNER_PERSONA.title.toLowerCase()}.`,
    "I can help shape a theme park day, zoo trip, beach day, city outing, or weekend plan.",
    "Start by telling me where you want to go and when, or answer these basics:",
    "- What kind of outing is this?",
    "- When is it happening?",
    "- Who is going?",
    "- What matters most: time, budget, kid-fit, food, accessibility, or flexibility?",
  ].join("\n");
}
