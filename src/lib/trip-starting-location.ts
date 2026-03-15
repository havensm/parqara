export const TRIP_STARTING_LOCATION_EVENT = "parqara:trip-starting-location";

export type TripStartingLocationEventDetail = {
  tripId: string;
  startingLocation: string;
};

export function emitTripStartingLocationEvent(tripId: string, startingLocation: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<TripStartingLocationEventDetail>(TRIP_STARTING_LOCATION_EVENT, {
      detail: {
        tripId,
        startingLocation,
      },
    })
  );
}
