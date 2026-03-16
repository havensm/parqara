"use client";

import { useState } from "react";

import type { SubscriptionTierValue, TripDetailDto } from "@/lib/contracts";
import {
  type TripPlannerChatMessage,
  type TripPlannerTripContext,
} from "@/lib/trip-planner-agent";
import { isPlannerKickoffDraft } from "@/lib/trip-workspace";

import { TripPlannerConcierge } from "@/components/assistant/trip-planner-concierge";
import { TripLiveReport } from "@/components/trip/trip-live-report";
import { TripPlannerSettingsDialog } from "@/components/trip/trip-planner-settings-dialog";

export function MaraPlannerFocus({
  currentTier,
  firstName,
  tripId,
  trip,
  tripContext,
  questions = [],
}: {
  currentTier: SubscriptionTierValue;
  firstName?: string | null;
  tripId: string;
  trip: TripDetailDto;
  tripContext?: TripPlannerTripContext;
  questions?: string[];
}) {
  const [messages, setMessages] = useState<TripPlannerChatMessage[]>([]);
  const [snapshotRefreshToken, setSnapshotRefreshToken] = useState(0);
  const starterMode = isPlannerKickoffDraft({
    status: trip.status,
    currentStep: trip.currentStep,
    itineraryCount: trip.itinerary.length,
  });

  return (
    <div className="space-y-4" data-testid="mara-planner-focus">
      <TripPlannerConcierge
        currentTier={currentTier}
        firstName={firstName}
        tripId={tripId}
        tripContext={tripContext}
        questions={questions}
        priorityMode
        refreshOnReply
        onMessagesChange={setMessages}
        starterMode={starterMode}
        onSnapshotApproved={() => setSnapshotRefreshToken((value) => value + 1)}
        headerAction={
          <TripPlannerSettingsDialog
            currentTier={currentTier}
            tripId={trip.id}
            tripName={trip.name}
            isOwner={trip.isOwner}
            triggerMode="icon"
          />
        }
      />

      <TripLiveReport tripId={tripId} trip={trip} messages={messages} starterMode={starterMode} refreshToken={snapshotRefreshToken} />
    </div>
  );
}
