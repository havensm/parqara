"use client";

import { useState } from "react";
import {
  CalendarDays,
  Compass,
  Route,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { SubscriptionTierValue, TripDetailDto } from "@/lib/contracts";
import {
  formatTripPlannerStatusLabel,
  type TripPlannerChatMessage,
  type TripPlannerTripContext,
} from "@/lib/trip-planner-agent";

import { TripPlannerConcierge } from "@/components/assistant/trip-planner-concierge";
import { PlanBadge } from "@/components/billing/plan-badge";
import { PlannerSectionKicker } from "@/components/trip/planner-section-kicker";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const signalRules = [
  { pattern: /low[- ]stress|relaxed|calm|easygoing|laid back/i, label: "Low-stress" },
  { pattern: /budget|cheap|affordable|save money|value/i, label: "Budget-aware" },
  { pattern: /splurge|luxury|premium|high-end/i, label: "Premium feel" },
  { pattern: /family|kids?|children/i, label: "Family-friendly" },
  { pattern: /date night|couple|romantic/i, label: "Date night" },
  { pattern: /weekend|saturday|sunday/i, label: "Weekend plan" },
  { pattern: /food|dining|lunch|dinner|snack|restaurant/i, label: "Food matters" },
  { pattern: /must[- ]do|priority|headliner/i, label: "Must-dos protected" },
  { pattern: /walking|steps|distance|pace/i, label: "Pacing matters" },
] as const;

const timingRules = [
  { pattern: /tonight/i, label: "Tonight" },
  { pattern: /this weekend|weekend/i, label: "Weekend" },
  { pattern: /saturday/i, label: "Saturday" },
  { pattern: /sunday/i, label: "Sunday" },
  { pattern: /morning/i, label: "Morning" },
  { pattern: /afternoon/i, label: "Afternoon" },
  { pattern: /evening/i, label: "Evening" },
] as const;

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

function trimCopy(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function uniqueLabels(values: string[]) {
  return Array.from(new Set(values));
}

function getUserConversationText(messages: TripPlannerChatMessage[]) {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ");
}

function getLatestAssistantTakeaway(messages: TripPlannerChatMessage[], trip: TripDetailDto) {
  const assistantMessages = messages.filter((message) => message.role === "assistant");

  // The first assistant message is Mara's welcome. The live brief should key off
  // the latest substantive reply after the user has started the conversation.
  const latestAssistantMessage = assistantMessages.length > 1 ? assistantMessages[assistantMessages.length - 1] : null;

  if (!latestAssistantMessage) {
    return trip.latestPlanSummary ?? "Start with Mara above and the live trip brief here will tighten around the conversation.";
  }

  const cleanedLines = latestAssistantMessage.content
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !/^(Trip brief|Suggested plan|Watch-outs|Next decision|Starter recommendation|Rough budget range|Example day|Tailored suggestions|Next step)$/i.test(line)
    );

  return trimCopy(cleanedLines[0] ?? latestAssistantMessage.content, 190);
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

  if (/family/i.test(userText) && !adultMatch && !kidAgeMatches.length) {
    return "Family outing";
  }

  if (adultMatch || kidAgeMatches.length) {
    const adults = adultMatch ? `${adultMatch[1]} ${adultMatch[1] === "1" ? "adult" : "adults"}` : "Group details in progress";
    const kids = kidAgeMatches.length ? `, kids ${kidAgeMatches.join(", ")}` : "";
    return `${adults}${kids}`;
  }

  return getSavedGroupSummary(trip);
}

function getConversationTimingSummary(userText: string, trip: TripDetailDto) {
  const cues = timingRules.filter((rule) => rule.pattern.test(userText)).map((rule) => rule.label);

  if (!cues.length) {
    return `${formatTripDate(trip.visitDate)} at ${trip.partyProfile.startTime}`;
  }

  const uniqueCues = uniqueLabels(cues).slice(0, 3);
  return `${uniqueCues.join(" · ")} · ${trip.partyProfile.startTime || "Flexible start"}`;
}

function getConversationSignals(userText: string, trip: TripDetailDto) {
  const matchedSignals = signalRules.filter((rule) => rule.pattern.test(userText)).map((rule) => rule.label);
  const fallbackSignals = [
    trip.partyProfile.mustDoRideIds.length ? `${trip.partyProfile.mustDoRideIds.length} must-dos saved` : "Must-dos still forming",
    trip.partyProfile.diningPreferences.length ? "Dining preferences saved" : "Food plan still open",
    `${trip.partyProfile.walkingTolerance.toLowerCase()} walking`,
  ];

  return uniqueLabels([...(matchedSignals.length ? matchedSignals : []), ...fallbackSignals]).slice(0, 6);
}

function getConversationFocus(userText: string, trip: TripDetailDto) {
  const matchedSignals = signalRules.filter((rule) => rule.pattern.test(userText)).map((rule) => rule.label);

  if (matchedSignals.length) {
    return matchedSignals.slice(0, 2).join(" · ");
  }

  if (trip.partyProfile.mustDoRideIds.length) {
    return `${trip.partyProfile.mustDoRideIds.length} must-dos in play`;
  }

  return "Clarifying priorities";
}

function getBudgetRead(userText: string, trip: TripDetailDto) {
  if (/budget|cheap|affordable|value/i.test(userText)) {
    return "Budget-sensitive planning";
  }

  if (/splurge|luxury|premium/i.test(userText)) {
    return "Higher-spend experience";
  }

  if (trip.partyProfile.diningPreferences.length) {
    return trip.partyProfile.diningPreferences.map((value) => value.replaceAll("-", " ")).slice(0, 2).join(" · ");
  }

  return "Dining and spend still flexible";
}

function DetailCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--card-border)] bg-white p-4 shadow-[0_10px_22px_rgba(12,20,37,0.04)]">
      <div className="flex items-center gap-3 text-[var(--foreground)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[rgba(238,253,249,0.9)] text-[var(--teal-700)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

export function MaraPlannerFocus({
  currentTier,
  maraStarterRepliesUsed = 0,
  firstName,
  tripId,
  trip,
  tripContext,
  questions = [],
}: {
  currentTier: SubscriptionTierValue;
  maraStarterRepliesUsed?: number;
  firstName?: string | null;
  tripId?: string;
  trip: TripDetailDto;
  tripContext?: TripPlannerTripContext;
  questions?: string[];
}) {
  const [messages, setMessages] = useState<TripPlannerChatMessage[]>([]);
  const userConversationText = getUserConversationText(messages);
  const signals = getConversationSignals(userConversationText, trip);
  const latestTakeaway = getLatestAssistantTakeaway(messages, trip);
  const statusLabel = formatTripPlannerStatusLabel(trip.status);

  return (
    <div className="space-y-5" data-testid="mara-planner-focus">
      <TripPlannerConcierge
        currentTier={currentTier}
        maraStarterRepliesUsed={maraStarterRepliesUsed}
        firstName={firstName}
        tripId={tripId}
        tripContext={tripContext}
        questions={questions}
        priorityMode
        refreshOnReply={Boolean(tripId)}
        onMessagesChange={setMessages}
      />

      {/* Keep a live planner read directly under Mara until assistant actions persist server-side. */}
      <Card tone="solid" className="overflow-hidden p-0 shadow-[0_18px_40px_rgba(12,20,37,0.05)]">
        <div className="border-b border-[var(--card-border)] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <PlannerSectionKicker emoji="🧾" label="Live brief" tone="sky" />
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-[2.2rem]">
                Trip details reacting to Mara
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                This brief updates from the conversation so the planner details below stay synced with what Mara is shaping.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 lg:justify-end">
              <PlanBadge tier={currentTier} />
              <Badge variant="neutral">{statusLabel}</Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
          <DetailCard
            label="Planner"
            value={trip.name}
            detail={`${trip.park.name} · ${statusLabel}`}
            icon={Compass}
          />
          <DetailCard
            label="Group"
            value={getConversationGroupSummary(userConversationText, trip)}
            detail={`Saved: ${getSavedGroupSummary(trip)}`}
            icon={Users}
          />
          <DetailCard
            label="Timing"
            value={getConversationTimingSummary(userConversationText, trip)}
            detail={`Visit ${formatTripDate(trip.visitDate)}`}
            icon={CalendarDays}
          />
          <DetailCard
            label="Focus"
            value={getConversationFocus(userConversationText, trip)}
            detail={getBudgetRead(userConversationText, trip)}
            icon={Route}
          />
        </div>

        <div className="border-t border-[var(--card-border)] px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
            <div>
              <div className="flex items-center gap-2 text-[var(--foreground)]">
                <Sparkles className="h-4 w-4 text-[var(--teal-700)]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Mara&apos;s latest read</p>
              </div>
              <p className="mt-3 text-base leading-7 text-[var(--foreground)]">{latestTakeaway}</p>
              {trip.latestPlanSummary ? (
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Saved summary: {trip.latestPlanSummary}</p>
              ) : null}
            </div>

            <div className="rounded-[26px] border border-[var(--card-border)] bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9ff_100%)] p-4">
              <div className="flex items-center gap-2 text-[var(--foreground)]">
                <Wallet className="h-4 w-4 text-[var(--amber-700)]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Conversation signals</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {signals.map((signal) => (
                  <Badge key={signal} variant="neutral">
                    {signal}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
