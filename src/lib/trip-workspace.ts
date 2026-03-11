import type { TripStatusValue } from "@/lib/contracts";

export type TripWorkspaceTab = {
  id: string;
  label: string;
  parkName: string;
  visitDate: string;
  status: TripStatusValue;
  href: string;
};

type TripWorkspaceTripLike = {
  id: string;
  name: string;
  parkName: string;
  visitDate: string;
  status: TripStatusValue;
  currentStep?: number;
  itineraryCount?: number;
};

const tripStatusPriority: Record<TripStatusValue, number> = {
  DRAFT: 0,
  PLANNED: 1,
  LIVE: 2,
  COMPLETED: 3,
};

export function getTripWorkspaceHref(trip: Pick<TripWorkspaceTripLike, "id" | "status">) {
  if (trip.status === "DRAFT") {
    return `/trips/new?tripId=${trip.id}`;
  }

  return `/trips/${trip.id}`;
}

export function getTripWorkspaceTabLabel(
  trip: Pick<TripWorkspaceTripLike, "name" | "parkName" | "status" | "currentStep">,
  index: number
) {
  const trimmedName = trip.name.trim();
  const trimmedParkName = trip.parkName.trim().toLowerCase();

  if (trimmedName) {
    const lowerName = trimmedName.toLowerCase();
    if (index === 0 && trip.status === "DRAFT" && trip.currentStep === 0 && lowerName.startsWith(trimmedParkName)) {
      return "My first trip";
    }

    return trimmedName;
  }

  return index === 0 ? "My first trip" : "Untitled trip";
}

export function buildTripWorkspaceTabs<T extends TripWorkspaceTripLike>(trips: T[]): TripWorkspaceTab[] {
  return trips.map((trip, index) => ({
    id: trip.id,
    label: getTripWorkspaceTabLabel(trip, index),
    parkName: trip.parkName,
    visitDate: trip.visitDate,
    status: trip.status,
    href: getTripWorkspaceHref(trip),
  }));
}

export function getTripWorkspaceStatusDetail(trip: Pick<TripWorkspaceTripLike, "status" | "currentStep" | "itineraryCount">) {
  if (trip.status === "DRAFT") {
    if ((trip.currentStep ?? 0) > 0) {
      return "Trip details are still being shaped";
    }

    return "Mara is still collecting the basics";
  }

  if (trip.status === "LIVE") {
    return `${trip.itineraryCount ?? 0} routed stops in motion`;
  }

  if (trip.status === "PLANNED") {
    return `${trip.itineraryCount ?? 0} routed stops ready`;
  }

  return `${trip.itineraryCount ?? 0} routed stops completed`;
}

export function pickDefaultTrip<T extends TripWorkspaceTripLike>(trips: T[]) {
  return [...trips].sort((left, right) => tripStatusPriority[left.status] - tripStatusPriority[right.status])[0] ?? null;
}
