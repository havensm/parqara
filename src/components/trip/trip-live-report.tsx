"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, Clock3, MapPinned, Route, Users, type LucideIcon } from "lucide-react";

import type {
  TripDetailDto,
  TripLiveSnapshotStateDto,
  TripLogisticsBoardDto,
} from "@/lib/contracts";
import type { TripPlannerChatMessage } from "@/lib/trip-planner-agent";
import { buildFallbackTripLiveSnapshot } from "@/lib/trip-live-snapshot";
import { TRIP_STARTING_LOCATION_EVENT, type TripStartingLocationEventDetail } from "@/lib/trip-starting-location";

import { FinalizePlanDialog } from "@/components/trip/finalize-plan-dialog";
import { Card } from "@/components/ui/card";

function formatRelativeDueDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function trimCopy(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function buildMapEmbedUrl(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=11&output=embed`;
}

function buildMapHref(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function getUserText(messages: TripPlannerChatMessage[]) {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ")
    .trim();
}

function inferTripTheme(userText: string, destination: string | null, activity: string | null) {
  if (activity?.trim()) {
    return activity.trim();
  }

  const normalized = userText.toLowerCase();

  if (/\bzoo\b/.test(normalized)) return "a zoo day";
  if (/date night|romantic|dinner/.test(normalized)) return "a night out";
  if (/\bdisney\b/.test(normalized)) return "a Disney trip";
  if (/\bbeach\b/.test(normalized)) return "a beach day";
  if (/\balaska\b/.test(normalized)) return "an Alaska trip";
  if (/weekend/.test(normalized)) return "a weekend trip";
  if (/vacation|holiday/.test(normalized)) return "a vacation";
  if (/birthday/.test(normalized)) return "a birthday outing";

  if (destination?.trim()) {
    return `a trip around ${destination.trim()}`;
  }

  return "the plan";
}

function inferGroupSnapshotSummary(userText: string, trip: TripDetailDto, board: TripLogisticsBoardDto | null, snapshotGroupSummary: string | null) {
  if (snapshotGroupSummary?.trim()) {
    return snapshotGroupSummary.trim();
  }

  if (board?.groups.length) {
    return `${board.groups.length} ${board.groups.length === 1 ? "person" : "people"}`;
  }

  const normalized = userText.toLowerCase();
  if (/wife|husband|partner|boyfriend|girlfriend|date night|couple/.test(normalized) && /(son|daughter|kid|child|toddler|family)/.test(normalized)) {
    return "a small family";
  }
  if (/wife|husband|partner|boyfriend|girlfriend|date night|couple/.test(normalized)) {
    return "two adults";
  }
  if (/family|son|daughter|kid|child|children|toddler/.test(normalized)) {
    return "a family";
  }
  if (trip.partyProfile.partySize > 0) {
    return `${trip.partyProfile.partySize} ${trip.partyProfile.partySize === 1 ? "traveler" : "travelers"}`;
  }

  return null;
}

function buildActivitySummary({
  trip,
  board,
  snapshot,
  messages,
  shouldStayBlank,
}: {
  trip: TripDetailDto;
  board: TripLogisticsBoardDto | null;
  snapshot: TripLiveSnapshotStateDto["currentSnapshot"] | ReturnType<typeof buildFallbackTripLiveSnapshot> | null;
  messages: TripPlannerChatMessage[];
  shouldStayBlank: boolean;
}) {
  if (shouldStayBlank || !snapshot) {
    return null;
  }

  const userText = getUserText(messages);
  const primaryActivity = snapshot.activities[0] ?? null;
  const theme = inferTripTheme(userText, snapshot.destination, primaryActivity);
  const groupSummary = inferGroupSnapshotSummary(userText, trip, board, snapshot.groupSummary);
  const normalizedTheme = theme.replace(/^[Aa]n?\s+/i, "");
  const closenessHint = /near me|nearby|close to home|local/.test(userText.toLowerCase()) ? "close to home" : null;
  const sentences: string[] = [];

  let lead = `Planning ${normalizedTheme}`;
  if (groupSummary) {
    lead += ` for ${groupSummary.toLowerCase()}`;
  }
  if (closenessHint) {
    lead += `, likely ${closenessHint}`;
  }
  sentences.push(`${lead}.`);

  if (snapshot.latestTakeaway?.trim()) {
    sentences.push(trimCopy(snapshot.latestTakeaway.trim(), 110));
  } else if (snapshot.travelSummary?.trim() || snapshot.lodgingSummary?.trim()) {
    const openItems = [snapshot.travelSummary, snapshot.lodgingSummary].filter((value) => value?.trim()).map((value) => value!.trim().toLowerCase());
    if (openItems.length) {
      sentences.push(`Still shaping ${openItems.join(" and ")}.`);
    }
  }

  return sentences.join(" ");
}

function getAttendeeSummary(board: TripLogisticsBoardDto | null, trip: TripDetailDto, shouldStayBlank: boolean) {
  if (!board?.groups.length) {
    return {
      headline: shouldStayBlank ? "Not set yet" : `${trip.partyProfile.partySize} ${trip.partyProfile.partySize === 1 ? "traveler" : "travelers"}`,
      detail: shouldStayBlank ? "Add who is going once Mara starts shaping the trip." : "Attendee roster will fill in here.",
    };
  }

  const attending = board.groups.filter((group) => group.person.attendanceStatus === "ATTENDING").length;
  const invited = board.groups.filter((group) => group.person.attendanceStatus === "INVITED").length;
  const maybe = board.groups.filter((group) => group.person.attendanceStatus === "MAYBE").length;
  const parts = [`${attending} attending`];
  if (invited) parts.push(`${invited} invited`);
  if (maybe) parts.push(`${maybe} maybe`);

  return {
    headline: `${board.groups.length} people on the trip`,
    detail: parts.join(" · "),
  };
}

function getLogisticsSnapshot(board: TripLogisticsBoardDto | null) {
  if (!board) {
    return { openCount: 0, doneCount: 0 };
  }

  const tasks = board.groups.flatMap((group) => group.tasks);
  return {
    openCount: tasks.filter((task) => task.status !== "DONE").length,
    doneCount: tasks.filter((task) => task.status === "DONE").length,
  };
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  needsInfo = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  needsInfo?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4">
      <div className="flex items-start gap-3">
        <div
          className={
            needsInfo
              ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[#f4d7aa] bg-[#fff6e9] text-[#d4871c] shadow-[0_8px_18px_rgba(12,20,37,0.04)]"
              : "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-[var(--teal-700)] shadow-[0_8px_18px_rgba(12,20,37,0.05)]"
          }
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
            {needsInfo ? <CircleAlert className="h-3.5 w-3.5 text-[#d4871c]" aria-hidden="true" /> : null}
          </div>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{value}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, children, needsInfo = false }: { title: string; children: ReactNode; needsInfo?: boolean }) {
  return (
    <div className="rounded-[22px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center gap-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{title}</p>
        {needsInfo ? <CircleAlert className="h-3.5 w-3.5 text-[#d4871c]" aria-hidden="true" /> : null}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function PlaceholderNote({ copy, needsInfo = false }: { copy: string; needsInfo?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      {needsInfo ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#d4871c]" aria-hidden="true" /> : null}
      <p className="text-sm leading-6 text-[var(--muted)]">{copy}</p>
    </div>
  );
}

export function TripLiveReport({
  tripId,
  trip,
  messages,
  starterMode = false,
  refreshToken = 0,
  approximateLocation,
}: {
  tripId: string;
  trip: TripDetailDto;
  messages: TripPlannerChatMessage[];
  starterMode?: boolean;
  refreshToken?: number;
  approximateLocation?: string | null;
}) {
  const [board, setBoard] = useState<TripLogisticsBoardDto | null>(null);
  const [snapshotState, setSnapshotState] = useState<TripLiveSnapshotStateDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startingLocationPreview, setStartingLocationPreview] = useState<string | null>(trip.startingLocation);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [boardResponse, snapshotResponse] = await Promise.all([
        fetch(`/api/trips/${tripId}/logistics`, { cache: "no-store" }),
        fetch(`/api/trips/${tripId}/live-snapshot`, { cache: "no-store" }),
      ]);

      const boardResult = (await boardResponse.json()) as { error?: string } & Partial<TripLogisticsBoardDto>;
      if (!boardResponse.ok || !boardResult.tripId) {
        throw new Error(boardResult.error || "Unable to load trip logistics.");
      }

      const snapshotResult = (await snapshotResponse.json()) as { error?: string } & Partial<TripLiveSnapshotStateDto>;
      if (!snapshotResponse.ok || !snapshotResult.tripId) {
        throw new Error(snapshotResult.error || "Unable to load the live snapshot.");
      }

      setBoard(boardResult as TripLogisticsBoardDto);
      setSnapshotState(snapshotResult as TripLiveSnapshotStateDto);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the live planner.");
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void loadReport();
  }, [loadReport, refreshToken]);

  useEffect(() => {
    setStartingLocationPreview(trip.startingLocation);
  }, [trip.id, trip.startingLocation]);

  useEffect(() => {
    const handleStartingLocation = (event: Event) => {
      const detail = (event as CustomEvent<TripStartingLocationEventDetail>).detail;
      if (detail.tripId !== trip.id) {
        return;
      }

      const trimmedLocation = detail.startingLocation.trim();
      setStartingLocationPreview(trimmedLocation ? trimmedLocation : null);
    };

    window.addEventListener(TRIP_STARTING_LOCATION_EVENT, handleStartingLocation as EventListener);
    return () => window.removeEventListener(TRIP_STARTING_LOCATION_EVENT, handleStartingLocation as EventListener);
  }, [trip.id]);

  const hasLiveInput = messages.some((message) => message.role === "user" && message.content.trim().length > 0);
  const shouldStayBlank = starterMode && !hasLiveInput && !snapshotState?.currentSnapshot;
  const fallbackSnapshot = useMemo(() => buildFallbackTripLiveSnapshot(trip, board, shouldStayBlank), [board, shouldStayBlank, trip]);
  const displaySnapshot = snapshotState?.currentSnapshot ?? fallbackSnapshot;
  const attendeeSummary = useMemo(() => getAttendeeSummary(board, trip, shouldStayBlank), [board, shouldStayBlank, trip]);
  const logisticsSnapshot = useMemo(() => getLogisticsSnapshot(board), [board]);
  const activitySummary = useMemo(
    () =>
      buildActivitySummary({
        trip,
        board,
        snapshot: displaySnapshot,
        messages,
        shouldStayBlank,
      }),
    [board, displaySnapshot, messages, shouldStayBlank, trip]
  );
  const approximateStartingLocation = approximateLocation?.trim() || null;
  const shouldUseApproximateLocation = !startingLocationPreview && starterMode && !snapshotState?.currentSnapshot && Boolean(approximateStartingLocation);
  const openTasks = useMemo(
    () =>
      (board?.groups.flatMap((group) => group.tasks.map((task) => ({ ...task, assigneeName: group.person.name || group.person.email }))) ?? [])
        .filter((task) => task.status !== "DONE")
        .slice(0, 6),
    [board]
  );
  const mapQuery = shouldUseApproximateLocation ? approximateStartingLocation : startingLocationPreview || displaySnapshot.mapQuery || displaySnapshot.destination;

  return (
    <Card tone="solid" className="overflow-hidden p-0 shadow-[0_16px_36px_rgba(12,20,37,0.05)]">
      <div className="border-b border-[var(--card-border)] px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Live planner</p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-[2.15rem]">
              Trip report.
            </h3>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Mara only updates this snapshot after you confirm the change, so the shared report stays readable and intentional.
            </p>
          </div>

          {trip.status === "DRAFT" && trip.canEdit ? (
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <FinalizePlanDialog tripId={tripId} tripName={trip.name} disabled={isLoading || !snapshotState?.currentSnapshot} />
              {!isLoading && !snapshotState?.currentSnapshot ? (
                <p className="text-sm text-[var(--muted)]">Confirm a snapshot update before you finalize the plan.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {isLoading ? <div className="rounded-[20px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-4 text-sm text-[var(--muted)]">Loading live planner...</div> : null}
        {error ? <div className="rounded-[20px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{error}</div> : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Who&apos;s going" value={attendeeSummary.headline} detail={attendeeSummary.detail} icon={Users} needsInfo={!board?.groups.length} />
          <SummaryCard label="Where" value={displaySnapshot.destination ?? "Not set yet"} detail={shouldStayBlank ? "Tell Mara where the trip is headed." : trip.park.name} icon={MapPinned} needsInfo={!displaySnapshot.destination} />
          <SummaryCard label="How long" value={displaySnapshot.duration ?? "Not set yet"} detail={shouldStayBlank ? "Tell Mara how long the trip is or what day you are planning for." : displaySnapshot.latestTakeaway ?? "Duration will firm up as the plan gets locked."} icon={Clock3} needsInfo={!displaySnapshot.duration} />
          <SummaryCard label="Travel" value={displaySnapshot.travelSummary ?? "Not set yet"} detail={displaySnapshot.lodgingSummary ?? "Lodging will show up here once it is pinned."} icon={Route} needsInfo={!displaySnapshot.travelSummary || !displaySnapshot.lodgingSummary} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_22rem]">
          <div className="space-y-4">
            <SectionCard title="What we&apos;re doing" needsInfo={!displaySnapshot.activities.length}>
              {displaySnapshot.activities.length ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {displaySnapshot.activities.map((item) => (
                      <span key={item} className="rounded-full border border-[var(--card-border)] bg-white px-3 py-1.5 text-sm text-[var(--foreground)]">
                        {item}
                      </span>
                    ))}
                  </div>
                  {activitySummary ? <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{activitySummary}</p> : null}
                </>
              ) : (
                <PlaceholderNote copy="Nothing is pinned yet. Tell Mara what kind of trip or outing you want to plan." needsInfo />
              )}
            </SectionCard>

            <SectionCard title="Attendee snapshot" needsInfo={!board?.groups.length}>
              <div className="space-y-3">
                {board?.groups.length ? (
                  board.groups.slice(0, 6).map((group) => (
                    <div key={group.person.id} className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--card-border)] bg-white px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--foreground)]">{group.person.name || group.person.email}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{group.person.attendanceStatus.toLowerCase().replaceAll("_", " ")}</p>
                      </div>
                      <div className="text-sm text-[var(--muted)]">{group.completion.done}/{group.completion.total}</div>
                    </div>
                  ))
                ) : (
                  <PlaceholderNote copy="Add people to the trip and their prep will show up here." needsInfo />
                )}
              </div>
            </SectionCard>

            <SectionCard title="Bring list" needsInfo={!displaySnapshot.supplies.length}>
              {displaySnapshot.supplies.length ? (
                <div className="space-y-2.5">
                  {displaySnapshot.supplies.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-[18px] border border-[var(--card-border)] bg-white px-4 py-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--teal-700)]" />
                      <p className="text-sm leading-6 text-[var(--foreground)]">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <PlaceholderNote copy="Supplies and documents will show up here once Mara confirms them into the snapshot." needsInfo />
              )}
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard title="Location map" needsInfo={!mapQuery}>
              {mapQuery ? (
                <>
                  <div className="overflow-hidden rounded-[20px] border border-[var(--card-border)] bg-white">
                    <iframe title={`Map for ${mapQuery}`} src={buildMapEmbedUrl(mapQuery)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-[260px] w-full border-0" />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{mapQuery}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{startingLocationPreview ? "Starting point pinned" : shouldUseApproximateLocation ? "Approximate starting area from your current location" : "Map centered on the trip location"}</p>
                    </div>
                    <a href={buildMapHref(mapQuery)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--teal-700)] transition hover:text-[var(--teal-800)]">
                      Open map
                    </a>
                  </div>
                </>
              ) : (
                <PlaceholderNote copy="Tell Mara where you are going or where the trip starts and the map will appear here." needsInfo />
              )}
            </SectionCard>

            <SectionCard title="Open prep" needsInfo={!openTasks.length && logisticsSnapshot.doneCount === 0}>
              {openTasks.length ? (
                <div className="space-y-2.5">
                  {openTasks.map((task) => (
                    <div key={task.id} className="rounded-[18px] border border-[var(--card-border)] bg-white px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--foreground)]">{task.title}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">{task.assigneeName}</p>
                        </div>
                        <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{task.status.toLowerCase().replaceAll("_", " ")}</span>
                      </div>
                      {task.dueDate ? <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Due {formatRelativeDueDate(task.dueDate)}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <PlaceholderNote copy="No prep is pinned yet. Ask Mara what the group still needs so you can track it here." needsInfo />
              )}

              <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] border border-[var(--card-border)] bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Prep progress</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{logisticsSnapshot.doneCount} done · {logisticsSnapshot.openCount} still open</p>
                </div>
                <a href="#trip-logistics-board" className="text-sm font-semibold text-[var(--teal-700)] transition hover:text-[var(--teal-800)]">
                  Open logistics
                </a>
              </div>
            </SectionCard>

            <SectionCard title="Latest from Mara" needsInfo={!displaySnapshot.latestTakeaway}>
              <p className="text-sm leading-7 text-[var(--foreground)]">{displaySnapshot.latestTakeaway ?? "Mara will fill this in once the trip starts taking shape."}</p>
              {snapshotState?.currentSnapshotUpdatedAt ? (
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Updated {formatTimestamp(snapshotState.currentSnapshotUpdatedAt)}</p>
              ) : null}
            </SectionCard>
          </div>
        </div>
      </div>
    </Card>
  );
}




