"use client";

import { useEffect, useState, useTransition } from "react";
import { CornerDownLeft, LoaderCircle, RotateCcw, SendHorizontal } from "lucide-react";

import { canAccessBillingFeature, getMaraStarterPreviewState, getPlanByTier } from "@/lib/billing";
import type { SubscriptionTierValue } from "@/lib/contracts";
import {
  buildTripPlannerWelcomeMessage,
  getTripPlannerStarterPrompts,
  TRIP_PLANNER_PERSONA,
  type TripPlannerChatMessage,
  type TripPlannerTripContext,
} from "@/lib/trip-planner-agent";

import { FeatureUpsellCard } from "@/components/billing/feature-upsell-card";
import { PlanBadge } from "@/components/billing/plan-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TripPlannerConciergeProps = {
  currentTier: SubscriptionTierValue;
  maraStarterRepliesUsed?: number;
  firstName?: string | null;
  tripContext?: TripPlannerTripContext;
  questions?: string[];
};

const textareaClassName =
  "min-h-[120px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#1b6b63]/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

function buildInitialMessages(firstName?: string | null, tripContext?: TripPlannerTripContext): TripPlannerChatMessage[] {
  return [
    {
      role: "assistant",
      content: buildTripPlannerWelcomeMessage(firstName, tripContext),
    },
  ];
}

export function TripPlannerConcierge({
  currentTier,
  maraStarterRepliesUsed = 0,
  firstName,
  tripContext,
  questions = [],
}: TripPlannerConciergeProps) {
  const [messages, setMessages] = useState<TripPlannerChatMessage[]>(() => buildInitialMessages(firstName, tripContext));
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [starterRepliesUsed, setStarterRepliesUsed] = useState(maraStarterRepliesUsed);
  const [isPending, startTransition] = useTransition();

  const hasFullAccess = canAccessBillingFeature(currentTier, "aiConcierge");
  const starterPreview = getMaraStarterPreviewState(currentTier, starterRepliesUsed);
  const isStarterPreview = !hasFullAccess && starterPreview.included;
  const isLocked = !hasFullAccess && !starterPreview.canSend;
  const currentPlan = getPlanByTier(currentTier);

  useEffect(() => {
    setMessages(buildInitialMessages(firstName, tripContext));
    setDraft("");
    setError(null);
    setStarterRepliesUsed(maraStarterRepliesUsed);
  }, [firstName, maraStarterRepliesUsed, tripContext]);

  function resetConversation() {
    if (isPending) {
      return;
    }

    setMessages(buildInitialMessages(firstName, tripContext));
    setDraft("");
    setError(null);
  }

  function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isPending || isLocked) {
      return;
    }

    const nextMessages: TripPlannerChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setDraft("");
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/assistant/trip-planner", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: nextMessages,
            tripId: tripContext?.id,
          }),
        });

        const result = (await response.json()) as {
          error?: string;
          reply?: string;
          fullAccess?: boolean;
          usedStarterReplies?: number;
          remainingStarterReplies?: number;
          starterReplyLimit?: number;
        };

        if (typeof result.usedStarterReplies === "number") {
          setStarterRepliesUsed(result.usedStarterReplies);
        }

        if (!response.ok || !result.reply) {
          throw new Error(result.error || "Mara could not respond right now.");
        }

        setMessages([...nextMessages, { role: "assistant", content: result.reply }]);
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Mara could not respond right now.");
      }
    });
  }

  const visibleQuestions = questions.length ? questions : getTripPlannerStarterPrompts(tripContext);
  const followUpMessages = messages.slice(1);
  const latestReply = [...followUpMessages].reverse().find((message) => message.role === "assistant") ?? null;
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user") ?? null;
  const starterReplyLabel = starterPreview.remainingReplies === 1 ? "reply" : "replies";

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Mara</p>
            {hasFullAccess ? <PlanBadge tier="PRO" /> : <PlanBadge tier={currentTier} label="Starter preview" />}
            {isStarterPreview ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {starterPreview.remainingReplies} {starterReplyLabel} left
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
            Chat with Mara
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {tripContext
              ? `Mara is focused on ${tripContext.name} at ${tripContext.parkName} on ${tripContext.visitDate}. Use this chat to fill gaps, tighten the plan, or ask for the next details she needs.`
              : TRIP_PLANNER_PERSONA.description}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={resetConversation} disabled={isPending}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset chat
        </Button>
      </div>

      {isStarterPreview && starterPreview.canSend ? (
        <div className="mt-6 rounded-[28px] border border-[#bfd4cb] bg-[#f5fbf8] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700/80">Starter preview</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">Give Mara a real kickoff task before you upgrade.</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {currentPlan.name} includes {starterPreview.replyLimit} Mara starter replies so you can see how she gathers missing details and shapes the trip before committing to Pro.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/80 bg-white px-4 py-4 text-sm font-medium leading-6 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              {starterPreview.remainingReplies} of {starterPreview.replyLimit} replies remaining
            </div>
          </div>
        </div>
      ) : null}

      {isLocked ? <FeatureUpsellCard className="mt-6" currentTier={currentTier} feature="aiConcierge" /> : null}

      <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 sm:p-5">
        <label className="block text-sm font-medium text-slate-700" htmlFor="trip-planner-message">
          {tripContext ? "Tell Mara what you want to clarify or change on this trip" : "Tell Mara what you are planning"}
        </label>
        <textarea
          id="trip-planner-message"
          className={`${textareaClassName} mt-3`}
          disabled={isLocked || isPending}
          placeholder={
            isLocked
              ? `You have used the ${starterPreview.replyLimit} Mara starter replies included on ${currentPlan.name}. Upgrade to Pro to keep planning with Mara.`
              : tripContext
                ? "Example: Review this trip, tell me what is still missing, and ask me the next two questions you need answered."
                : "Example: I want a low-stress Saturday trip for two adults and one 8-year-old, somewhere within a short drive, with good food and a flexible pace."
          }
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage(draft);
            }
          }}
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <CornerDownLeft className="h-3.5 w-3.5" />
            {hasFullAccess
              ? "Press Enter to send, Shift+Enter for a new line."
              : isLocked
                ? `You have used all ${starterPreview.replyLimit} Mara starter replies on ${currentPlan.name}.`
                : `${starterPreview.remainingReplies} Mara starter ${starterReplyLabel} left on ${currentPlan.name}.`}
          </p>
          <Button type="button" onClick={() => sendMessage(draft)} disabled={isPending || !draft.trim() || isLocked}>
            <SendHorizontal className="mr-2 h-4 w-4" />
            Send
          </Button>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-[22px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{error}</p> : null}

      {latestUserMessage || latestReply || isPending ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Latest request</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">{latestUserMessage?.content ?? "Ask Mara a question to start shaping this trip."}</p>
          </div>
          <div className="rounded-[26px] border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Latest from Mara</p>
            {isPending ? (
              <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Mara is shaping the next step...
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-slate-700">{latestReply?.content ?? "Mara will reply here once you send a question."}</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-6 border-t border-slate-200/80 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Questions Mara still needs</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {visibleQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => sendMessage(question)}
              disabled={isPending || isLocked}
              className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left text-sm font-medium leading-6 text-slate-700 transition hover:border-[#bfd4cb] hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              {question}
            </button>
          ))}
        </div>
        {tripContext?.detailTags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tripContext.detailTags.map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
