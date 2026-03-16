import type {
  TripDetailDto,
  TripLiveSnapshotChangeDto,
  TripLiveSnapshotDto,
  TripLiveSnapshotProposalDto,
  TripLogisticsBoardDto,
} from "@/lib/contracts";
import type { TripPlannerChatMessage } from "@/lib/trip-planner-agent";

const SNAPSHOT_FIELD_LABELS: Record<keyof TripLiveSnapshotDto, string> = {
  destination: "destination",
  duration: "duration",
  groupSummary: "group",
  travelSummary: "travel",
  lodgingSummary: "lodging",
  activities: "activities",
  supplies: "bring list",
  latestTakeaway: "latest takeaway",
  mapQuery: "map",
  status: "status",
};

function trimText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function firstSentence(value: string, maxLength = 160) {
  const normalized = trimText(value);
  const first = normalized.split(/(?<=[.!?])\s+/)[0] ?? normalized;
  if (first.length <= maxLength) {
    return first;
  }

  return `${first.slice(0, maxLength - 1).trimEnd()}...`;
}

function sameStringArray(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function buildDisplayValue(value: TripLiveSnapshotDto[keyof TripLiveSnapshotDto]) {
  if (Array.isArray(value)) {
    return value.length ? value.join(" · ") : "Cleared";
  }

  if (typeof value === "string") {
    return value;
  }

  if (value === null) {
    return "Cleared";
  }

  return String(value);
}

function getUserText(messages: TripPlannerChatMessage[]) {
  return trimText(
    messages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .join(" ")
  );
}

function inferDestination(fullText: string) {
  const normalized = fullText.toLowerCase();
  const destinationMatchers: Array<[RegExp, string]> = [
    [/\balaska\b/i, "Alaska"],
    [/\bdisney\b/i, "Disney"],
    [/\bzoo\b/i, "Zoo"],
    [/\bbeach\b/i, "Beach"],
    [/\bnyc\b|new york city/i, "New York City"],
    [/\bvegas\b|las vegas/i, "Las Vegas"],
    [/\bcabin\b/i, "Cabin trip"],
  ];
  const mapped = destinationMatchers.find(([pattern]) => pattern.test(normalized));

  if (mapped) {
    return mapped[1];
  }

  const explicit = fullText.match(/(?:to|in|at)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})/);
  return explicit?.[1]?.trim() ?? null;
}

function inferDuration(fullText: string) {
  const normalized = fullText.toLowerCase();
  const numericMatch = normalized.match(/\b(\d+)\s*(day|days|night|nights|week|weeks)\b/);
  if (numericMatch) {
    return `${numericMatch[1]} ${numericMatch[2]}`;
  }

  if (/week[- ]long|full week|weeklong/.test(normalized)) {
    return "Week-long";
  }
  if (/weekend/.test(normalized)) {
    return "Weekend";
  }
  if (/tonight|today|day trip|single day/.test(normalized)) {
    return "Single day";
  }

  return null;
}

function inferGroupSummary(fullText: string, board: TripLogisticsBoardDto | null, trip: TripDetailDto) {
  if (board?.groups.length) {
    const attending = board.groups.filter((group) => group.person.attendanceStatus === "ATTENDING").length;
    const maybe = board.groups.filter((group) => group.person.attendanceStatus === "MAYBE").length;
    if (attending || maybe) {
      return [attending ? `${attending} attending` : null, maybe ? `${maybe} maybe` : null].filter(Boolean).join(" · ");
    }
  }

  const normalized = fullText.toLowerCase();
  const withOthersMatch = normalized.match(/with\s+(\d+)\s+other\s+(?:people|friends|guests|travelers|adults)/);
  if (withOthersMatch) {
    const total = Number(withOthersMatch[1]) + 1;
    return `${total} travelers`;
  }

  const countMatch = normalized.match(/(?:for|with)\s+(\d+)\s+(?:people|guests|travelers|adults)/);
  if (countMatch) {
    return `${countMatch[1]} travelers`;
  }

  if (/date night|couple|romantic/.test(normalized)) {
    return "2 travelers";
  }
  if (/family/.test(normalized)) {
    return "Family trip";
  }

  return trip.partyProfile.partySize > 0 ? `${trip.partyProfile.partySize} ${trip.partyProfile.partySize === 1 ? "traveler" : "travelers"}` : null;
}

function inferTravelSummary(fullText: string, board: TripLogisticsBoardDto | null) {
  const normalized = fullText.toLowerCase();
  const transportTasks =
    board?.groups.flatMap((group) => group.tasks).filter((task) => task.category === "TRANSPORT").map((task) => task.title) ?? [];
  if (transportTasks.length) {
    return transportTasks.slice(0, 2).join(" · ");
  }
  if (/flight|flying|airport|airfare/.test(normalized)) {
    return "Flights are part of the trip";
  }
  if (/drive|driving|road trip|car/.test(normalized)) {
    return "Driving plan";
  }
  if (/cruise|ferry/.test(normalized)) {
    return "Water travel";
  }
  return null;
}

function inferLodgingSummary(fullText: string, board: TripLogisticsBoardDto | null) {
  const normalized = fullText.toLowerCase();
  const lodgingTasks =
    board?.groups.flatMap((group) => group.tasks).filter((task) => task.category === "LODGING").map((task) => task.title) ?? [];
  if (lodgingTasks.length) {
    return lodgingTasks.slice(0, 2).join(" · ");
  }
  const lodgingMatch = normalized.match(/(hotel|resort|airbnb|cabin|lodge)/);
  if (lodgingMatch) {
    return `${lodgingMatch[1][0].toUpperCase()}${lodgingMatch[1].slice(1)} plans mentioned`;
  }
  return null;
}

function inferActivities(fullText: string, trip: TripDetailDto) {
  const normalized = fullText.toLowerCase();
  const activities: string[] = [];
  const push = (value: string) => {
    if (!activities.includes(value)) {
      activities.push(value);
    }
  };

  if (/zoo/.test(normalized)) push("Zoo day");
  if (/fishing/.test(normalized)) push("Fishing");
  if (/date night|romantic/.test(normalized)) push("Date night");
  if (/family/.test(normalized)) push("Family outing");
  if (/hike|hiking/.test(normalized)) push("Hiking");
  if (/beach/.test(normalized)) push("Beach time");
  if (/museum/.test(normalized)) push("Museum stop");
  if (/food|dinner|lunch|restaurant/.test(normalized)) push("Food stops");

  for (const item of trip.itinerary.slice(0, 2)) {
    push(item.title);
  }

  return activities.slice(0, 5);
}

function inferSupplies(fullText: string, board: TripLogisticsBoardDto | null) {
  const normalized = fullText.toLowerCase();
  const supplies: string[] = [];
  const push = (value: string) => {
    if (!supplies.includes(value)) {
      supplies.push(value);
    }
  };

  const taskItems =
    board?.groups
      .flatMap((group) => group.tasks)
      .filter((task) => task.category === "GEAR" || task.category === "DOCS")
      .map((task) => task.title) ?? [];
  for (const item of taskItems) {
    push(item);
  }

  if (/passport|real id|id/.test(normalized)) push("Real ID or passport");
  if (/flight|airport/.test(normalized)) push("Flight confirmations");
  if (/fishing/.test(normalized)) push("Fishing gear");
  if (/alaska|cold|winter/.test(normalized)) push("Warm layers and outerwear");
  if (/beach|sun/.test(normalized)) push("Sunscreen and beach gear");
  if (/kid|family|baby|children/.test(normalized)) push("Kid essentials and snacks");

  return supplies.slice(0, 6);
}

export function createEmptyTripLiveSnapshot(): TripLiveSnapshotDto {
  return {
    destination: null,
    duration: null,
    groupSummary: null,
    travelSummary: null,
    lodgingSummary: null,
    activities: [],
    supplies: [],
    latestTakeaway: null,
    mapQuery: null,
    status: "DRAFT",
  };
}

export function normalizeTripLiveSnapshot(value: unknown): TripLiveSnapshotDto | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const input = value as Record<string, unknown>;
  return {
    destination: typeof input.destination === "string" ? trimText(input.destination) || null : null,
    duration: typeof input.duration === "string" ? trimText(input.duration) || null : null,
    groupSummary: typeof input.groupSummary === "string" ? trimText(input.groupSummary) || null : null,
    travelSummary: typeof input.travelSummary === "string" ? trimText(input.travelSummary) || null : null,
    lodgingSummary: typeof input.lodgingSummary === "string" ? trimText(input.lodgingSummary) || null : null,
    activities: Array.isArray(input.activities)
      ? input.activities.filter((item) => typeof item === "string").map((item) => trimText(item)).filter(Boolean).slice(0, 6)
      : [],
    supplies: Array.isArray(input.supplies)
      ? input.supplies.filter((item) => typeof item === "string").map((item) => trimText(item)).filter(Boolean).slice(0, 8)
      : [],
    latestTakeaway: typeof input.latestTakeaway === "string" ? trimText(input.latestTakeaway) || null : null,
    mapQuery: typeof input.mapQuery === "string" ? trimText(input.mapQuery) || null : null,
    status: input.status === "CONFIRMED" ? "CONFIRMED" : "DRAFT",
  };
}

export function buildFallbackTripLiveSnapshot(trip: TripDetailDto, board: TripLogisticsBoardDto | null, shouldStayBlank = false): TripLiveSnapshotDto {
  if (shouldStayBlank) {
    return createEmptyTripLiveSnapshot();
  }

  const travelTasks =
    board?.groups.flatMap((group) => group.tasks).filter((task) => task.category === "TRANSPORT").map((task) => task.title) ?? [];
  const lodgingTasks =
    board?.groups.flatMap((group) => group.tasks).filter((task) => task.category === "LODGING").map((task) => task.title) ?? [];
  const supplyTasks =
    board?.groups
      .flatMap((group) => group.tasks)
      .filter((task) => task.category === "GEAR" || task.category === "DOCS")
      .map((task) => task.title) ?? [];

  return {
    destination: trip.park.name || trip.name,
    duration: trip.status === "DRAFT" ? null : formatTripStatusDurationFallback(trip),
    groupSummary: trip.partyProfile.partySize ? `${trip.partyProfile.partySize} ${trip.partyProfile.partySize === 1 ? "traveler" : "travelers"}` : null,
    travelSummary: travelTasks[0] ?? null,
    lodgingSummary: lodgingTasks[0] ?? null,
    activities: trip.itinerary.slice(0, 4).map((item) => item.title),
    supplies: supplyTasks.slice(0, 6),
    latestTakeaway: trip.latestPlanSummary,
    mapQuery: trip.startingLocation || trip.park.name || trip.name,
    status: "CONFIRMED",
  };
}

function formatTripStatusDurationFallback(trip: TripDetailDto) {
  if (trip.status === "LIVE") {
    return "Today";
  }

  return trip.visitDate;
}

export function buildTripLiveSnapshotProposal(input: {
  trip: TripDetailDto;
  board: TripLogisticsBoardDto | null;
  messages: TripPlannerChatMessage[];
  reply: string;
  currentSnapshot: TripLiveSnapshotDto | null;
}): TripLiveSnapshotProposalDto | null {
  const userText = getUserText(input.messages);
  if (!userText) {
    return null;
  }

  const baseline = input.currentSnapshot ?? buildFallbackTripLiveSnapshot(input.trip, input.board, false);
  const next: TripLiveSnapshotDto = {
    ...baseline,
    activities: [...baseline.activities],
    supplies: [...baseline.supplies],
    status: "CONFIRMED",
  };
  const changes: TripLiveSnapshotChangeDto[] = [];

  function setField<K extends keyof TripLiveSnapshotDto>(field: K, value: TripLiveSnapshotDto[K]) {
    if (field === "activities" || field === "supplies") {
      const arrayValue = value as string[];
      const currentValue = next[field] as string[];
      if (!arrayValue.length || sameStringArray(currentValue, arrayValue)) {
        return;
      }
      next[field] = value;
      changes.push({ field, label: SNAPSHOT_FIELD_LABELS[field], nextValue: buildDisplayValue(arrayValue) });
      return;
    }

    if (!value || next[field] === value) {
      return;
    }

    next[field] = value;
    changes.push({ field, label: SNAPSHOT_FIELD_LABELS[field], nextValue: buildDisplayValue(value) });
  }

  setField("destination", inferDestination(userText));
  setField("duration", inferDuration(userText));
  setField("groupSummary", inferGroupSummary(userText, input.board, input.trip));
  setField("travelSummary", inferTravelSummary(userText, input.board));
  setField("lodgingSummary", inferLodgingSummary(userText, input.board));
  setField("activities", inferActivities(userText, input.trip));
  setField("supplies", inferSupplies(userText, input.board));
  setField("latestTakeaway", firstSentence(input.reply));

  const nextMapQuery = input.trip.startingLocation || inferDestination(userText) || baseline.mapQuery;
  setField("mapQuery", nextMapQuery);

  if (!changes.length) {
    return null;
  }

  const labels = changes.map((change) => change.label);
  return {
    tripId: input.trip.id,
    snapshot: next,
    changes,
    summary: `Mara is ready to update ${labels.join(", ")} in the live snapshot.`,
  };
}

