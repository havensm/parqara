"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LoaderCircle, RotateCcw, Save, SendHorizontal, X } from "lucide-react";

import type { SubscriptionTierValue, TripLiveSnapshotProposalDto } from "@/lib/contracts";
import {
  buildTripPlannerWelcomeMessage,
  getTripPlannerStarterPrompts,
  type TripPlannerChatMessage,
  type TripPlannerTripContext,
} from "@/lib/trip-planner-agent";
import { cn } from "@/lib/utils";

import { MaraPortrait } from "@/components/assistant/mara-portrait";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TripPlannerConciergeProps = {
  currentTier: SubscriptionTierValue;
  firstName?: string | null;
  tripId: string;
  tripContext?: TripPlannerTripContext;
  questions?: string[];
  priorityMode?: boolean;
  onMessagesChange?: (messages: TripPlannerChatMessage[]) => void;
  refreshOnReply?: boolean;
  headerAction?: ReactNode;
  starterMode?: boolean;
  onSnapshotApproved?: () => void;
};

const textareaClassName =
  "min-h-[104px] w-full resize-none rounded-[22px] border border-[var(--card-border)] bg-white px-4 py-3 text-[15px] text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[rgba(27,107,99,0.32)]";

function buildInitialMessages(firstName?: string | null, tripContext?: TripPlannerTripContext, starterMode = false): TripPlannerChatMessage[] {
  return [
    {
      role: "assistant",
      content: buildTripPlannerWelcomeMessage(firstName, tripContext, starterMode),
    },
  ];
}

function buildMaraWorkingStatus(lastUserMessage: string, tripContext?: TripPlannerTripContext, starterMode = false) {
  const normalized = lastUserMessage.toLowerCase();

  if (starterMode) {
    return "Pulling out the basics.";
  }

  if (/budget|cheap|affordable|under \$|\$/i.test(normalized)) {
    return "Keeping budget in view.";
  }

  if (/food|dinner|lunch|restaurant|snack|dessert/i.test(normalized)) {
    return "Looking at food and timing.";
  }

  if (/walk|route|pace|stress|easy|relaxed/i.test(normalized)) {
    return "Checking pace and route tradeoffs.";
  }

  if (/kid|family|stroller|baby|child|children/i.test(normalized)) {
    return "Checking group fit.";
  }

  if (/start|hotel|home|leave|drive|parking|location/i.test(normalized)) {
    return "Working through where the day should start.";
  }

  if (/ride|must-do|priority|show|attraction/i.test(normalized)) {
    return "Protecting the main must-dos.";
  }

  if (tripContext) {
    return `Shaping ${tripContext.name}.`;
  }

  return "Looking for the cleanest next move.";
}

async function parsePlannerReplyResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as {
      error?: string;
      reply?: string;
      snapshotProposal?: TripLiveSnapshotProposalDto | null;
    };
  }

  const text = await response.text();
  const trimmed = text.trim();
  const isHtml = trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<body") || trimmed.startsWith("<");

  return {
    error: isHtml ? "Mara took too long to respond. Try again." : trimmed || "Mara could not respond right now.",
  };
}

export function TripPlannerConcierge({
  firstName,
  tripId,
  tripContext,
  questions = [],
  priorityMode = false,
  onMessagesChange,
  refreshOnReply = false,
  headerAction,
  starterMode = false,
  onSnapshotApproved,
}: TripPlannerConciergeProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<TripPlannerChatMessage[]>(() => buildInitialMessages(firstName, tripContext, starterMode));
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [snapshotProposal, setSnapshotProposal] = useState<TripLiveSnapshotProposalDto | null>(null);
  const [isApprovingSnapshot, setIsApprovingSnapshot] = useState(false);
  const [isPending, startTransition] = useTransition();
  const threadScrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const activeTripIdRef = useRef(tripId);

  const quickPrompts = questions.length ? questions : getTripPlannerStarterPrompts(tripContext, starterMode);
  const latestUserMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === "user")?.content ?? "",
    [messages]
  );
  const maraWorkingStatus = useMemo(
    () => buildMaraWorkingStatus(latestUserMessage, tripContext, starterMode),
    [latestUserMessage, starterMode, tripContext]
  );

  useEffect(() => {
    if (activeTripIdRef.current === tripId) {
      return;
    }

    activeTripIdRef.current = tripId;
    setMessages(buildInitialMessages(firstName, tripContext, starterMode));
    setDraft("");
    setError(null);
    setIsSuggestionsOpen(false);
    setSnapshotProposal(null);
  }, [firstName, starterMode, tripContext, tripId]);

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  useEffect(() => {
    const thread = threadScrollRef.current;
    if (!thread) {
      return;
    }

    thread.scrollTo({
      top: thread.scrollHeight,
      behavior: "smooth",
    });
  }, [isPending, messages]);

  function resetConversation() {
    if (isPending || isApprovingSnapshot) {
      return;
    }

    setMessages(buildInitialMessages(firstName, tripContext, starterMode));
    setDraft("");
    setError(null);
    setIsSuggestionsOpen(false);
    setSnapshotProposal(null);
  }

  function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isPending) {
      return;
    }

    if (!tripId) {
      setError("Open a planner to talk with Mara.");
      return;
    }

    const nextMessages: TripPlannerChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setDraft("");
    setError(null);
    setIsSuggestionsOpen(false);
    setSnapshotProposal(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/assistant/trip-planner", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: nextMessages,
            tripId,
          }),
        });

        const result = await parsePlannerReplyResponse(response);

        if (!response.ok || !result.reply) {
          throw new Error(result.error || "Mara could not respond right now.");
        }

        const resolvedMessages: TripPlannerChatMessage[] = [...nextMessages, { role: "assistant", content: result.reply }];
        setMessages(resolvedMessages);
        setSnapshotProposal(result.snapshotProposal ?? null);

        if (refreshOnReply) {
          router.refresh();
        }
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Mara could not respond right now.");
      }
    });
  }

  async function approveSnapshotProposal() {
    if (!snapshotProposal || isApprovingSnapshot) {
      return;
    }

    setIsApprovingSnapshot(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/live-snapshot`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snapshot: snapshotProposal.snapshot,
          label: "Snapshot approved from Mara",
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to update the live snapshot.");
      }

      setSnapshotProposal(null);
      onSnapshotApproved?.();
      router.refresh();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Unable to update the live snapshot.");
    } finally {
      setIsApprovingSnapshot(false);
    }
  }

  function dismissSnapshotProposal() {
    if (isApprovingSnapshot) {
      return;
    }

    setSnapshotProposal(null);
  }

  function handleComposerFocus() {
    window.setTimeout(() => {
      composerRef.current?.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    }, 120);
  }

  return (
    <Card
      tone="solid"
      className={cn(
        "overflow-hidden border border-white/74 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,250,255,0.96))] shadow-[0_22px_48px_rgba(12,20,37,0.08)]",
        priorityMode ? "rounded-[32px]" : "rounded-[28px]"
      )}
    >
      <div className="border-b border-[var(--card-border)] px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <MaraPortrait size={priorityMode ? "md" : "sm"} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Mara</p>
              <h2 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-[1.85rem] font-semibold tracking-tight text-[var(--foreground)] sm:text-[2.05rem]">
                {starterMode ? "Start planning" : tripContext?.name ?? "Planner"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                {starterMode ? "Tell Mara what you want to plan." : tripContext ? `${tripContext.parkName} · ${tripContext.visitDate}` : "Open a planner to talk with Mara."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            {headerAction}
            <Button type="button" variant="ghost" size="sm" onClick={resetConversation} disabled={isPending || isApprovingSnapshot}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div
          ref={threadScrollRef}
          className="soft-scrollbar flex min-h-[220px] max-h-[360px] flex-col gap-3 overflow-y-auto rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] p-4 sm:p-5"
        >
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}-${message.content.slice(0, 24)}`} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-[22px] px-4 py-3 text-sm leading-7 shadow-[0_10px_24px_rgba(12,20,37,0.04)] whitespace-pre-wrap",
                  message.role === "user"
                    ? "bg-slate-950 text-white"
                    : "border border-[var(--card-border)] bg-white text-[var(--foreground)]"
                )}
              >
                <p className={cn("mb-1 text-[11px] font-semibold uppercase tracking-[0.18em]", message.role === "user" ? "text-white/60" : "text-[var(--muted)]")}>
                  {message.role === "user" ? "You" : "Mara"}
                </p>
                <p>{message.content}</p>
              </div>
            </div>
          ))}

          {isPending ? (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-[22px] border border-[var(--card-border)] bg-white px-4 py-3 text-sm text-[var(--muted)] shadow-[0_10px_24px_rgba(12,20,37,0.04)]">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Mara</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Working through it...
                  </div>
                  <p className="text-[var(--foreground)]">{maraWorkingStatus}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {error ? <div className="mt-4 rounded-[20px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{error}</div> : null}

        {snapshotProposal ? (
          <div className="mt-4 rounded-[24px] border border-[rgba(18,109,100,0.14)] bg-[linear-gradient(180deg,rgba(243,252,250,0.98),rgba(255,255,255,0.98))] p-4 shadow-[0_10px_24px_rgba(12,20,37,0.04)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Live snapshot update</p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{snapshotProposal.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {snapshotProposal.changes.map((change) => (
                    <span key={`${change.field}-${change.nextValue}`} className="rounded-full border border-[rgba(18,109,100,0.14)] bg-white px-3 py-1.5 text-sm text-[var(--foreground)]">
                      {change.label}: {change.nextValue}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={dismissSnapshotProposal} disabled={isApprovingSnapshot}>
                  <X className="h-4 w-4" />
                  Not now
                </Button>
                <Button type="button" size="sm" onClick={() => void approveSnapshotProposal()} disabled={isApprovingSnapshot}>
                  {isApprovingSnapshot ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Update snapshot
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div ref={composerRef} className="mt-4 rounded-[24px] border border-[var(--card-border)] bg-white p-3 sm:p-4">
          <textarea
            className={textareaClassName}
            disabled={isPending || isApprovingSnapshot}
            placeholder={starterMode ? "What do you want to plan?" : tripContext ? "What should we change?" : "Open a planner to talk with Mara."}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onFocus={handleComposerFocus}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage(draft);
              }
            }}
          />
          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={() => sendMessage(draft)} disabled={isPending || isApprovingSnapshot || !draft.trim()}>
              <SendHorizontal className="h-4 w-4" />
              Send
            </Button>
          </div>
        </div>

        {quickPrompts.length ? (
          <div className="mt-3 rounded-[22px] border border-[var(--card-border)] bg-white/80 p-2.5 sm:p-3">
            <button
              type="button"
              onClick={() => setIsSuggestionsOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-3 rounded-[18px] px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
              aria-expanded={isSuggestionsOpen}
              aria-controls={`planner-prompt-suggestions-${tripId}`}
            >
              <span>Prompt ideas</span>
              <ChevronDown className={cn("h-4 w-4 text-[var(--muted)] transition", isSuggestionsOpen ? "rotate-180" : "")} />
            </button>
            {isSuggestionsOpen ? (
              <div id={`planner-prompt-suggestions-${tripId}`} className="mt-2 flex flex-wrap gap-2 px-1 pb-1">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    disabled={isPending || isApprovingSnapshot}
                    className="rounded-[16px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-3.5 py-2 text-sm text-[var(--foreground)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
