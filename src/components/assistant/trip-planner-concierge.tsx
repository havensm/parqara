"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RotateCcw, Save, SendHorizontal, X } from "lucide-react";

import type { SubscriptionTierValue, TripLiveSnapshotProposalDto, TripPlannerInteractivePromptDto } from "@/lib/contracts";
import {
  buildTripPlannerWelcomeMessage,
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
  initialMessages?: TripPlannerChatMessage[];
  canResetConversation?: boolean;
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

function resolveInitialMessages(
  firstName?: string | null,
  tripContext?: TripPlannerTripContext,
  starterMode = false,
  initialMessages: TripPlannerChatMessage[] = []
) {
  return initialMessages.length ? initialMessages : buildInitialMessages(firstName, tripContext, starterMode);
}

async function parsePlannerReplyResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as {
      error?: string;
      reply?: string;
      snapshotProposal?: TripLiveSnapshotProposalDto | null;
      interactivePrompt?: TripPlannerInteractivePromptDto | null;
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
  initialMessages = [],
  canResetConversation = false,
  priorityMode = false,
  onMessagesChange,
  refreshOnReply = false,
  headerAction,
  starterMode = false,
  onSnapshotApproved,
}: TripPlannerConciergeProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<TripPlannerChatMessage[]>(() =>
    resolveInitialMessages(firstName, tripContext, starterMode, initialMessages)
  );
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [snapshotProposal, setSnapshotProposal] = useState<TripLiveSnapshotProposalDto | null>(null);
  const [interactivePrompt, setInteractivePrompt] = useState<TripPlannerInteractivePromptDto | null>(null);
  const [interactiveValue, setInteractiveValue] = useState("");
  const [isApprovingSnapshot, setIsApprovingSnapshot] = useState(false);
  const [isResettingHistory, setIsResettingHistory] = useState(false);
  const [isPending, startTransition] = useTransition();
  const threadScrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const activeTripIdRef = useRef(tripId);
  useEffect(() => {
    if (activeTripIdRef.current === tripId) {
      return;
    }

    activeTripIdRef.current = tripId;
    setMessages(resolveInitialMessages(firstName, tripContext, starterMode, initialMessages));
    setDraft("");
    setError(null);
    setSnapshotProposal(null);
    setInteractivePrompt(null);
    setInteractiveValue("");
  }, [firstName, initialMessages, starterMode, tripContext, tripId]);

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

  useEffect(() => {
    if (!interactivePrompt) {
      setInteractiveValue("");
      return;
    }

    if (interactivePrompt.kind === "SELECT") {
      setInteractiveValue(interactivePrompt.options[0]?.value ?? "");
      return;
    }

    setInteractiveValue("");
  }, [interactivePrompt]);

  function submitInteractivePrompt(nextValue?: string) {
    if (!interactivePrompt || isPending || isApprovingSnapshot || isResettingHistory) {
      return;
    }

    if (interactivePrompt.kind === "ADDRESS") {
      const typedValue = (nextValue ?? interactiveValue).trim();
      if (!typedValue) {
        return;
      }

      sendMessage(`We are starting from ${typedValue}.`);
      return;
    }

    const selectedValue = nextValue ?? interactiveValue;
    const option = interactivePrompt.options.find((item) => item.value === selectedValue);
    if (!option) {
      return;
    }

    sendMessage(option.sendAs);
  }

  async function resetConversation() {
    if (isPending || isApprovingSnapshot || isResettingHistory || !canResetConversation) {
      return;
    }

    setError(null);
    setIsResettingHistory(true);

    try {
      const response = await fetch(`/api/trips/${tripId}/mara-history`, {
        method: "DELETE",
      });
      const result = response.headers.get("content-type")?.includes("application/json")
        ? ((await response.json()) as { error?: string })
        : { error: "Unable to reset this conversation." };

      if (!response.ok) {
        throw new Error(result.error || "Unable to reset this conversation.");
      }

      setMessages(buildInitialMessages(firstName, tripContext, starterMode));
      setDraft("");
      setSnapshotProposal(null);
      setInteractivePrompt(null);
      setInteractiveValue("");
      router.refresh();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to reset this conversation.");
    } finally {
      setIsResettingHistory(false);
    }
  }

  function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || isPending || isResettingHistory) {
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
    setSnapshotProposal(null);
    setInteractivePrompt(null);
    setInteractiveValue("");

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
        setInteractivePrompt(result.interactivePrompt ?? null);

        if (refreshOnReply) {
          router.refresh();
        }
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Mara could not respond right now.");
      }
    });
  }

  async function approveSnapshotProposal() {
    if (!snapshotProposal || isApprovingSnapshot || isResettingHistory) {
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
    if (isApprovingSnapshot || isResettingHistory) {
      return;
    }

    setSnapshotProposal(null);
    setInteractivePrompt(null);
    setInteractiveValue("");
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
            {canResetConversation ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => void resetConversation()} disabled={isPending || isApprovingSnapshot || isResettingHistory}>
                {isResettingHistory ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Reset
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div
          ref={threadScrollRef}
          className="soft-scrollbar flex min-h-[320px] max-h-[520px] flex-col gap-3 overflow-y-auto rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] p-4 sm:min-h-[380px] sm:max-h-[620px] sm:p-5"
        >
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}-${message.content.slice(0, 24)}`} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-[22px] px-4 py-3 text-sm leading-7 shadow-[0_10px_24px_rgba(12,20,37,0.04)] whitespace-pre-wrap",
                  message.role === "user"
                    ? "border border-[rgba(18,109,100,0.18)] bg-[linear-gradient(135deg,rgba(28,74,94,0.98),rgba(35,132,129,0.94))] text-white"
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
                <Button type="button" variant="secondary" size="sm" onClick={dismissSnapshotProposal} disabled={isApprovingSnapshot || isResettingHistory}>
                  <X className="h-4 w-4" />
                  Not now
                </Button>
                <Button type="button" size="sm" onClick={() => void approveSnapshotProposal()} disabled={isApprovingSnapshot || isResettingHistory}>
                  {isApprovingSnapshot ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Update snapshot
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {!snapshotProposal && interactivePrompt ? (
          <div className="mt-4 rounded-[24px] border border-[rgba(18,109,100,0.16)] bg-[linear-gradient(180deg,rgba(240,251,248,0.94),rgba(255,255,255,0.98))] p-4 shadow-[0_10px_24px_rgba(12,20,37,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Mara needs one more detail</p>
            <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{interactivePrompt.prompt}</p>
            {interactivePrompt.helper ? <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{interactivePrompt.helper}</p> : null}

            {interactivePrompt.kind === "SINGLE_SELECT" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {interactivePrompt.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => submitInteractivePrompt(option.value)}
                    disabled={isPending || isApprovingSnapshot || isResettingHistory}
                    className="rounded-[16px] border border-[rgba(18,109,100,0.16)] bg-white px-3.5 py-2 text-sm text-[var(--foreground)] transition hover:border-[rgba(18,109,100,0.28)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}

            {interactivePrompt.kind === "SELECT" ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={interactiveValue}
                  onChange={(event) => setInteractiveValue(event.currentTarget.value)}
                  className="h-11 min-w-0 flex-1 rounded-[16px] border border-[var(--card-border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(27,107,99,0.32)]"
                  disabled={isPending || isApprovingSnapshot || isResettingHistory}
                >
                  {interactivePrompt.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button type="button" size="sm" onClick={() => submitInteractivePrompt()} disabled={isPending || isApprovingSnapshot || isResettingHistory || !interactiveValue}>
                  {interactivePrompt.submitLabel ?? "Use answer"}
                </Button>
              </div>
            ) : null}

            {interactivePrompt.kind === "ADDRESS" ? (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={interactiveValue}
                  onChange={(event) => setInteractiveValue(event.currentTarget.value)}
                  placeholder={interactivePrompt.placeholder ?? "Enter an address"}
                  autoComplete={interactivePrompt.autoComplete ?? "street-address"}
                  list={`planner-address-suggestions-${tripId}`}
                  className="h-12 w-full rounded-[16px] border border-[var(--card-border)] bg-white px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[rgba(27,107,99,0.32)]"
                  disabled={isPending || isApprovingSnapshot || isResettingHistory}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitInteractivePrompt();
                    }
                  }}
                />
                <datalist id={`planner-address-suggestions-${tripId}`}>
                  {interactivePrompt.suggestions.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
                {interactivePrompt.suggestions.length ? (
                  <div className="flex flex-wrap gap-2">
                    {interactivePrompt.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setInteractiveValue(suggestion)}
                        disabled={isPending || isApprovingSnapshot || isResettingHistory}
                        className="rounded-[16px] border border-[var(--card-border)] bg-white px-3 py-1.5 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="flex justify-end">
                  <Button type="button" size="sm" onClick={() => submitInteractivePrompt()} disabled={isPending || isApprovingSnapshot || isResettingHistory || !interactiveValue.trim()}>
                    {interactivePrompt.submitLabel ?? "Use address"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div ref={composerRef} className="mt-4 rounded-[24px] border border-[var(--card-border)] bg-white p-3 sm:p-4">
          <textarea
            className={textareaClassName}
            disabled={isPending || isApprovingSnapshot || isResettingHistory}
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
            <Button type="button" onClick={() => sendMessage(draft)} disabled={isPending || isApprovingSnapshot || isResettingHistory || !draft.trim()}>
              <SendHorizontal className="h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}


