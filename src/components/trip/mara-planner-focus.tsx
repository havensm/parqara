"use client";

import { useState } from "react";
import { CalendarDays, Clock3, Route, Users } from "lucide-react";

import type { SubscriptionTierValue, TripDetailDto } from "@/lib/contracts";
import {
  formatTripPlannerStatusLabel,
  type TripPlannerChatMessage,
  type TripPlannerTripContext,
} from "@/lib/trip-planner-agent";

import { TripPlannerConcierge } from "@/components/assistant/trip-planner-concierge";
import { TripPlannerSettingsDialog } from "@/components/trip/trip-planner-settings-dialog";
import { Card } from "@/components/ui/card";

function formatTripDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTimeLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function trimCopy(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function getUserConversationText(messages: TripPlannerChatMessage[]) {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ");
}

function getSavedGroupSummary(trip: TripDetailDto) {
  const kids = trip.partyProfile.kidsAges.length ? `, kids ${trip.partyProfile.kidsAges.join(", ")}` : "";
  return `${trip.partyProfile.partySize} ${trip.partyProfile.partySize === 1 ? "guest" : "guests"}${kids}`;
}

function getConversationGroupSummary(userText: string, trip: TripDetailDto) {
  const adultMatch = userText.match(/(\d+)\s*(?:adults?|people|guests?|travelers?)/i);
  const kidAgeMatches = Array.from(userText.matchAll(/\b(\d{1,2})\s*(?:year[- ]old|yo)\b/gi)).map((match) => match[1]);

  if (/date night|couple|romantic/i.test(userText)) {
    return "Couple outing";
  }

  if (adultMatch || kidAgeMatches.length) {
    const adults = adultMatch ? `${adultMatch[1]} ${adultMatch[1] === "1" ? "adult" : "adults"}` : "Group";
    const kids = kidAgeMatches.length ? `, kids ${kidAgeMatches.join(", ")}` : "";
    return `${adults}${kids}`;
  }

  return getSavedGroupSummary(trip);
}

function getConversationFocus(userText: string, trip: TripDetailDto) {
  if (/budget|cheap|affordable|value/i.test(userText)) {
    return "Keep it budget-aware";
  }

  if (/slow|easy|relaxed|low[- ]stress/i.test(userText)) {
    return "Keep the pace easy";
  }

  if (/food|dinner|lunch|restaurant|snack/i.test(userText)) {
    return "Food matters";
  }

  if (/must[- ]do|priority|headliner/i.test(userText)) {
    return "Protect the must-dos";
  }

  if (trip.partyProfile.mustDoRideIds.length) {
    return `${trip.partyProfile.mustDoRideIds.length} must-dos saved`;
  }

  return "Still shaping the day";
}

function getLatestAssistantTakeaway(messages: TripPlannerChatMessage[], trip: TripDetailDto) {
  const assistantMessages = messages.filter((message) => message.role === "assistant");
  const latestAssistantMessage = assistantMessages.length > 1 ? assistantMessages[assistantMessages.length - 1] : null;

  if (!latestAssistantMessage) {
    return trip.latestPlanSummary ?? "Ask Mara and this will tighten up.";
  }

  const cleanedLines = latestAssistantMessage.content
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  return trimCopy(cleanedLines[0] ?? latestAssistantMessage.content, 180);
}

function DetailBlock({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-[var(--teal-700)] shadow-[0_8px_18px_rgba(12,20,37,0.05)]">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{value}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
        </div>
      </div>
    </div>
  );
}

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
  const userConversationText = getUserConversationText(messages);
  const latestTakeaway = getLatestAssistantTakeaway(messages, trip);
  const nextItem = trip.itinerary.find((item) => item.status === "PLANNED") ?? trip.itinerary[0] ?? null;

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

      <Card tone="solid" className="overflow-hidden p-0 shadow-[0_16px_36px_rgba(12,20,37,0.05)]">
        <div className="border-b border-[var(--card-border)] px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Trip details</p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-[2.15rem]">
            Saved plan
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {trip.name} · {trip.park.name} · {formatTripDate(trip.visitDate)} · {formatTripPlannerStatusLabel(trip.status)}
          </p>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-3 sm:p-6">
          <DetailBlock
            label="Who"
            value={getConversationGroupSummary(userConversationText, trip)}
            detail={`Saved group: ${getSavedGroupSummary(trip)}`}
            icon={Users}
          />
          <DetailBlock
            label="When"
            value={`${formatTripDate(trip.visitDate)} at ${trip.partyProfile.startTime}`}
            detail={trip.partyProfile.breakStart && trip.partyProfile.breakEnd ? `Break ${trip.partyProfile.breakStart}-${trip.partyProfile.breakEnd}` : "No break saved yet"}
            icon={CalendarDays}
          />
          <DetailBlock
            label="Focus"
            value={getConversationFocus(userConversationText, trip)}
            detail={trip.latestPlanSummary ?? "Mara will keep shaping this as you talk."}
            icon={Route}
          />
        </div>

        <div className="grid gap-4 border-t border-[var(--card-border)] px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Latest from Mara</p>
            <p className="mt-3 text-base leading-7 text-[var(--foreground)]">{latestTakeaway}</p>
          </div>

          <div className="rounded-[20px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-[var(--teal-700)] shadow-[0_8px_18px_rgba(12,20,37,0.05)]">
                <Clock3 className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Next up</p>
                <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{nextItem ? nextItem.title : "No route yet"}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {nextItem
                    ? `${formatTimeLabel(nextItem.startTime)} · ${nextItem.predictedWaitMinutes}m wait · ${nextItem.walkingMinutes}m walk`
                    : "Ask Mara to sketch the day."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
