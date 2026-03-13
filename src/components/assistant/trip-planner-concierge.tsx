"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CornerDownLeft, Info, LoaderCircle, RotateCcw, SendHorizontal, Sparkles, X } from "lucide-react";

import { canAccessBillingFeature, getMaraStarterPreviewState, getPlanByTier } from "@/lib/billing";
import type { SubscriptionTierValue } from "@/lib/contracts";
import {
  buildTripPlannerWelcomeMessage,
  getTripPlannerStarterPrompts,
  TRIP_PLANNER_PERSONA,
  type TripPlannerChatMessage,
  type TripPlannerTripContext,
} from "@/lib/trip-planner-agent";
import { cn } from "@/lib/utils";

import { FeatureUpsellCard } from "@/components/billing/feature-upsell-card";
import { PlanBadge } from "@/components/billing/plan-badge";
import { MaraPortrait } from "@/components/assistant/mara-portrait";
import { PlannerSectionKicker } from "@/components/trip/planner-section-kicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TripPlannerConciergeProps = {
  currentTier: SubscriptionTierValue;
  maraStarterRepliesUsed?: number;
  firstName?: string | null;
  tripContext?: TripPlannerTripContext;
  questions?: string[];
  priorityMode?: boolean;
};

type MaraWorkflowExample = {
  title: string;
  description: string;
  prompt: string;
};

const textareaClassName =
  "min-h-[96px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#1b6b63]/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const generalWorkflowExamples: MaraWorkflowExample[] = [
  {
    title: "Start with the rough idea",
    description: "Give Mara the rough idea and let her pull the basics.",
    prompt: "I want to plan an adventure. Ask me the first one or two details you need.",
  },
  {
    title: "Lead with destination",
    description: "Start with the destination and let Mara shape the rest.",
    prompt: "I know where I want to go. Ask me the next one or two details you need.",
  },
  {
    title: "Plan around constraints",
    description: "Lead with constraints like budget, food, pace, or access.",
    prompt: "Help me plan a low-stress day for my group around food, pacing, and two must-dos.",
  },
];

const tripWorkflowExamples: MaraWorkflowExample[] = [
  {
    title: "Find what is still missing",
    description: "Ask Mara what is still missing before you build.",
    prompt: "Review this trip and tell me what details are still missing before it is ready.",
  },
  {
    title: "Stress-test the itinerary",
    description: "Use Mara to check pace, walking, and fit.",
    prompt: "Pressure-test this trip for walking, pacing, and whether it feels realistic for our group.",
  },
  {
    title: "Adjust priorities quickly",
    description: "Ask Mara how the plan should shift when priorities change.",
    prompt: "Update this trip so it protects a calmer morning and makes food stops more important.",
  },
];

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
  priorityMode = false,
}: TripPlannerConciergeProps) {
  const [messages, setMessages] = useState<TripPlannerChatMessage[]>(() => buildInitialMessages(firstName, tripContext));
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [starterRepliesUsed, setStarterRepliesUsed] = useState(maraStarterRepliesUsed);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const hasFullAccess = canAccessBillingFeature(currentTier, "aiConcierge");
  const starterPreview = getMaraStarterPreviewState(currentTier, starterRepliesUsed);
  const isStarterPreview = !hasFullAccess && starterPreview.included;
  const isLocked = !hasFullAccess && !starterPreview.canSend;
  const currentPlan = getPlanByTier(currentTier);
  const isGenericKickoff = !tripContext;
  const workflowExamples = tripContext ? tripWorkflowExamples : generalWorkflowExamples;

  useEffect(() => {
    setMessages(buildInitialMessages(firstName, tripContext));
    setDraft("");
    setError(null);
    setStarterRepliesUsed(maraStarterRepliesUsed);
  }, [firstName, maraStarterRepliesUsed, tripContext]);

  useEffect(() => {
    if (!showInfoDialog) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowInfoDialog(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showInfoDialog]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isPending, messages]);

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
          usedStarterReplies?: number;
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

  const visibleQuestions = (questions.length ? questions : getTripPlannerStarterPrompts(tripContext)).slice(0, 2);
  const compactExamples = workflowExamples.slice(0, priorityMode ? 3 : workflowExamples.length);
  const starterReplyLabel = starterPreview.remainingReplies === 1 ? "reply" : "replies";
  const showFollowUpPrompts = !priorityMode || !isGenericKickoff;

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden p-5 sm:p-6",
          priorityMode &&
            "border-[#cfe4dc] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,252,251,0.98))] shadow-[0_22px_56px_rgba(15,23,42,0.06)]"
        )}
      >
        {priorityMode ? (
          <div className="-mx-5 -mt-5 mb-5 border-b border-[#d7e7e1] bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.14),transparent_28%),linear-gradient(180deg,rgba(244,252,250,0.98),rgba(255,255,255,0.98))] px-5 py-5 sm:-mx-6 sm:-mt-6 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <MaraPortrait size="md" className="shrink-0" />
                <div className="max-w-3xl">
                  <PlannerSectionKicker emoji="✨" label="Mara" tone="teal" />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h2 className="font-[family-name:var(--font-space-grotesk)] text-[2rem] font-semibold tracking-tight text-slate-950 sm:text-[2.25rem]">
                      {tripContext ? "Ask Mara to shape this trip." : "Start with Mara."}
                    </h2>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInfoDialog(true)}
                      className="gap-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                    >
                      <Info className="h-4 w-4" />
                      Meet Mara
                    </Button>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                    {tripContext
                      ? "Use Mara first for changes, tradeoffs, missing details, and next steps. The planner below is the follow-through layer."
                      : "Give Mara the destination, the vibe, or the must-dos. She will ask for the next one or two details and shape the draft."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                {hasFullAccess ? <PlanBadge tier="PRO" /> : <PlanBadge tier={currentTier} label="Starter preview" />}
                {isStarterPreview ? (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {starterPreview.remainingReplies} {starterReplyLabel} left
                  </span>
                ) : null}
                <Button type="button" variant="secondary" onClick={resetConversation} disabled={isPending} className="rounded-full">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <PlannerSectionKicker emoji="✨" label="Mara" tone="teal" />
                {hasFullAccess ? <PlanBadge tier="PRO" /> : <PlanBadge tier={currentTier} label="Starter preview" />}
                {isStarterPreview ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {starterPreview.remainingReplies} {starterReplyLabel} left
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
                  Chat with Mara
                </h2>
                <MaraPortrait size="sm" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInfoDialog(true)}
                  className="gap-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                >
                  <Info className="h-4 w-4" />
                  Meet Mara
                </Button>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                {tripContext
                  ? `Focused on ${tripContext.name} at ${tripContext.parkName} on ${tripContext.visitDate}. Ask Mara to tighten the plan or make changes here.`
                  : "Start with the destination, vibe, or must-dos. Mara will ask for the next one or two details."}
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={resetConversation} disabled={isPending}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset chat
            </Button>
          </div>
        )}

        <div
          className={cn(
            "mt-5 rounded-[26px] border border-slate-200 bg-white p-4 sm:p-5",
            priorityMode &&
              "relative overflow-hidden border-[#c8ddd6] bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_32%),linear-gradient(180deg,rgba(246,252,250,0.99),rgba(255,255,255,0.99))] p-5 shadow-[0_28px_64px_rgba(15,23,42,0.1)] sm:p-6"
          )}
        >
          {priorityMode ? <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,rgba(96,165,250,0.12),transparent_22%)]" /> : null}
          <div className="relative z-10">
            <div className={cn("flex flex-col gap-3", priorityMode && "gap-4") }>
              <div className={cn("flex flex-col gap-3", priorityMode && "rounded-[24px] border border-white/80 bg-white/78 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.05)] sm:p-5") }>
                <div className={cn("flex flex-col gap-3", priorityMode && "lg:flex-row lg:items-start lg:justify-between") }>
                  <div className="max-w-3xl">
                    {priorityMode ? <PlannerSectionKicker emoji="💬" label="Main way to steer the planner" tone="teal" /> : null}
                    <label className={cn("block text-sm font-medium text-slate-700", priorityMode && "mt-3 text-lg font-semibold text-slate-950")} htmlFor="trip-planner-message">
                      {tripContext ? "Tell Mara what to change next." : "Start planning with Mara."}
                    </label>
                    <p className={cn("mt-2 text-sm leading-6 text-slate-600", priorityMode && "max-w-3xl text-[15px] leading-7 text-slate-600")}>
                      {tripContext
                        ? "Start with the change, tradeoff, or question. Mara should be the first place you steer this planner."
                        : "Start with the destination, the kind of adventure, or the must-dos. Mara will ask for the next one or two details from there."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <p className={cn("flex items-center gap-2 text-xs text-slate-500", priorityMode && "rounded-full border border-white/80 bg-white/92 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500") }>
                      <CornerDownLeft className="h-3.5 w-3.5" />
                      {hasFullAccess
                        ? "Enter sends"
                        : isLocked
                          ? `${starterPreview.replyLimit} starter replies used`
                          : `${starterPreview.remainingReplies} ${starterReplyLabel} left`}
                    </p>
                    {priorityMode ? (
                      <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/92 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                        Ask in plain language
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className={cn("mt-4 rounded-[24px] border border-slate-200 bg-slate-50/90 p-3 sm:p-4", priorityMode && "border-[#d6e7e2] bg-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]")}>
                  <div className={cn("flex max-h-[300px] flex-col gap-3 overflow-y-auto pr-1 sm:max-h-[340px]", priorityMode && "max-h-[360px]")}>
                    {messages.map((message, index) => (
                      <div key={`${message.role}-${index}-${message.content.slice(0, 24)}`} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[86%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)] whitespace-pre-wrap sm:max-w-[78%]",
                            message.role === "user"
                              ? "bg-slate-950 text-white"
                              : "border border-slate-200 bg-white text-slate-700"
                          )}
                        >
                          <p
                            className={cn(
                              "mb-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                              message.role === "user" ? "text-white/60" : "text-teal-700/70"
                            )}
                          >
                            {message.role === "user" ? "You" : "Mara"}
                          </p>
                          <p>{message.content}</p>
                        </div>
                      </div>
                    ))}
                    {isPending ? (
                      <div className="flex justify-start">
                        <div className="max-w-[86%] rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:max-w-[78%]">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700/70">Mara</p>
                          <div className="flex items-center gap-2">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Mara is working...
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <div ref={threadEndRef} />
                  </div>
                </div>

                <textarea
                  id="trip-planner-message"
                  className={cn(
                    `${textareaClassName}`,
                    priorityMode &&
                      "min-h-[120px] rounded-[30px] border-[#b9d0c8] bg-white px-5 py-4 text-base shadow-[0_18px_36px_rgba(15,23,42,0.05)]"
                  )}
                  disabled={isLocked || isPending}
                  placeholder={
                    isLocked
                      ? `You have used the ${starterPreview.replyLimit} Mara starter replies included on ${currentPlan.name}. Upgrade to Pro to keep planning with Mara.`
                      : tripContext
                        ? "Example: Review this plan, make lunch easier, and ask me the next one or two details you still need."
                        : "Example: I want to plan a Saturday adventure for two adults and one 8-year-old. Ask me the first one or two details you need."
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

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {(tripContext
                      ? ["Adjust pacing", "Protect must-dos", "Rework lunch"]
                      : ["Pick a park", "Set the vibe", "List must-dos"]
                    ).map((hint) => (
                      <span
                        key={hint}
                        className={cn(
                          "rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600",
                          priorityMode && "bg-white"
                        )}
                      >
                        {hint}
                      </span>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={() => sendMessage(draft)}
                    disabled={isPending || !draft.trim() || isLocked}
                    className={cn(priorityMode && "h-12 rounded-full px-7 text-sm shadow-[0_18px_38px_rgba(15,23,42,0.14)]")}
                  >
                    <SendHorizontal className="mr-2 h-4 w-4" />
                    {priorityMode ? "Send to Mara" : "Send"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isGenericKickoff ? (
          <div className={cn("mt-5", priorityMode && "rounded-[24px] border border-slate-200/80 bg-white/72 p-4 sm:p-5")}>
            <PlannerSectionKicker emoji="🗺️" label={priorityMode ? "Need a faster start?" : "Start here"} tone="sky" />
            {priorityMode ? <p className="mt-2 text-sm text-slate-600">Tap one and Mara will take it from there.</p> : null}
            <div className="mt-3 grid gap-2.5 md:grid-cols-3">
              {compactExamples.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => sendMessage(item.prompt)}
                  disabled={isPending || isLocked}
                  className={cn(
                    "rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-[#bfd4cb] hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
                    priorityMode && "shadow-none"
                  )}
                >
                  <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.description}</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {isLocked ? <FeatureUpsellCard className="mt-5" currentTier={currentTier} feature="aiConcierge" /> : null}
        {error ? <p className="mt-4 rounded-[22px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{error}</p> : null}

        {showFollowUpPrompts ? (
          <div className={cn("mt-5", !priorityMode && "border-t border-slate-200/80 pt-6")}>
            <PlannerSectionKicker emoji={isGenericKickoff ? "💬" : "🧩"} label={isGenericKickoff ? "Prompts to try" : "Helpful follow-ups"} tone={isGenericKickoff ? "violet" : "amber"} />
            <div className={cn("mt-3", priorityMode ? "flex flex-wrap gap-2.5" : "grid gap-3 md:grid-cols-2")}>
              {visibleQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendMessage(question)}
                  disabled={isPending || isLocked}
                  className={cn(
                    "border border-slate-200 bg-white text-left text-sm font-medium text-slate-700 transition hover:border-[#bfd4cb] hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
                    priorityMode ? "rounded-full px-3.5 py-2 leading-5" : "rounded-[24px] px-4 py-4 leading-6"
                  )}
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
        ) : null}
      </Card>

      {showInfoDialog ? <MaraInfoDialog tripContext={tripContext} onClose={() => setShowInfoDialog(false)} /> : null}
    </>
  );
}

function MaraInfoDialog({ tripContext, onClose }: { tripContext?: TripPlannerTripContext; onClose: () => void }) {
  const workflowExamples = (tripContext ? tripWorkflowExamples : generalWorkflowExamples).slice(0, 3);
  const usageItems = tripContext
    ? [
        "Find what is still missing.",
        "Change pacing, food, or must-dos quickly.",
        "Rework the plan when the day changes.",
      ]
    : [
        "Turn a rough outing idea into a plan.",
        "Figure out the next one or two details fast.",
        "Shape the day around real constraints.",
      ];
  const bestInputs = tripContext
    ? ["what changed", "what to protect", "what feels off"]
    : ["where to go", "who is going", "must-dos", "budget or pace"];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mara-info-title"
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,252,0.98))] p-6 shadow-[0_32px_90px_rgba(15,23,42,0.24)] sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-teal-100 text-teal-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <PlannerSectionKicker emoji="💡" label="Meet Mara" tone="teal" />
            </div>
            <h3 id="mara-info-title" className="mt-4 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
              The planner behind the planner
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Mara turns rough ideas into a clear next step. Start with the ask, then let her shape the plan with you.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 rounded-full border border-slate-200 bg-white p-0 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700">
            <X className="h-4 w-4" />
            <span className="sr-only">Close Mara info</span>
          </Button>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-4">
            <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col items-center text-center">
                <MaraPortrait size="lg" />
                <p className="mt-4 text-xl font-semibold text-slate-950">{TRIP_PLANNER_PERSONA.name}</p>
                <p className="mt-1 text-sm font-medium text-teal-700">{TRIP_PLANNER_PERSONA.title}</p>
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {TRIP_PLANNER_PERSONA.personality.map((item) => (
                  <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#eefbf8_0%,#ffffff_100%)] p-5">
              <p className="text-sm font-semibold text-slate-950">Best when you share</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {bestInputs.map((item) => (
                  <span key={item} className="rounded-full border border-white/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-950">Use Mara for</p>
              <div className="mt-4 space-y-2.5">
                {usageItems.map((item) => (
                  <InfoListItem key={item} text={item} />
                ))}
              </div>
            </div>

            <div>
              <PlannerSectionKicker emoji="🧠" label="Try one of these" tone="violet" />
              <div className="mt-3 grid gap-3">
                {workflowExamples.map((item) => (
                  <WorkflowExampleCard key={item.title} item={item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoListItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-teal-700 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <p className="text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function WorkflowExampleCard({ item }: { item: MaraWorkflowExample }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-950">{item.title}</p>
      <div className="mt-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Say this</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{item.prompt}</p>
      </div>
    </div>
  );
}
