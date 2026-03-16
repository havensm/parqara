"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { LoaderCircle, Mail, Plus, Route, Sparkles, UserPlus2 } from "lucide-react";

import type {
  TripAttendanceStatusValue,
  TripLogisticsBoardDto,
  TripLogisticsCategoryValue,
  TripLogisticsTaskDto,
  TripLogisticsTaskStatusValue,
} from "@/lib/contracts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const categoryOptions: Array<{ value: TripLogisticsCategoryValue; label: string }> = [
  { value: "DOCS", label: "Docs" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "GEAR", label: "Gear" },
  { value: "TIME_OFF", label: "Time off" },
  { value: "LODGING", label: "Lodging" },
  { value: "OTHER", label: "Other" },
];

const taskStatusOptions: Array<{ value: TripLogisticsTaskStatusValue; label: string }> = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
  { value: "BLOCKED", label: "Blocked" },
];

const statusPillStyles: Record<TripLogisticsTaskStatusValue, string> = {
  TODO: "border-slate-200 bg-slate-50 text-slate-600",
  IN_PROGRESS: "border-cyan-200 bg-cyan-50 text-cyan-700",
  DONE: "border-teal-200 bg-teal-50 text-teal-700",
  BLOCKED: "border-rose-200 bg-rose-50 text-rose-700",
};

const attendancePillStyles: Record<TripAttendanceStatusValue, string> = {
  INVITED: "border-slate-200 bg-slate-50 text-slate-600",
  ATTENDING: "border-teal-200 bg-teal-50 text-teal-700",
  MAYBE: "border-amber-200 bg-amber-50 text-amber-700",
  NOT_ATTENDING: "border-rose-200 bg-rose-50 text-rose-700",
};

function formatCategoryLabel(value: TripLogisticsCategoryValue) {
  return categoryOptions.find((option) => option.value === value)?.label ?? value;
}

function formatStatusLabel(value: TripLogisticsTaskStatusValue) {
  return taskStatusOptions.find((option) => option.value === value)?.label ?? value;
}

function formatAttendanceLabel(value: TripAttendanceStatusValue) {
  switch (value) {
    case "INVITED":
      return "Invited";
    case "ATTENDING":
      return "Attending";
    case "MAYBE":
      return "Maybe";
    case "NOT_ATTENDING":
      return "Not attending";
    default:
      return value;
  }
}

function formatAccessLabel(value: "NONE" | "VIEW" | "EDIT") {
  switch (value) {
    case "NONE":
      return "No planner access";
    case "VIEW":
      return "View";
    case "EDIT":
      return "Edit";
    default:
      return value;
  }
}

function StatusPill({ label, className }: { label: string; className: string }) {
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${className}`}>{label}</span>;
}

function TaskRow({
  task,
  canManage,
  busy,
  onStatusChange,
  onDelete,
  onRemind,
}: {
  task: TripLogisticsTaskDto;
  canManage: boolean;
  busy: boolean;
  onStatusChange: (taskId: string, status: TripLogisticsTaskStatusValue) => void;
  onDelete: (taskId: string) => void;
  onRemind: (taskId: string) => void;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--card-border)] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(12,20,37,0.04)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--foreground)]">{task.title}</p>
            <StatusPill label={formatCategoryLabel(task.category)} className="border-slate-200 bg-slate-50 text-slate-500" />
            <StatusPill label={formatStatusLabel(task.status)} className={statusPillStyles[task.status]} />
          </div>
          {task.note ? <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{task.note}</p> : null}
          {task.dueDate ? <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Due {task.dueDate}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-[16px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(27,107,99,0.32)]"
            value={task.status}
            onChange={(event) => onStatusChange(task.id, event.currentTarget.value as TripLogisticsTaskStatusValue)}
            disabled={busy}
          >
            {taskStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {canManage ? (
            <>
              <Button type="button" variant="secondary" size="sm" onClick={() => onRemind(task.id)} disabled={busy}>
                <Mail className="h-4 w-4" />
                Remind
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
                disabled={busy}
                className="text-[#b14b41] hover:bg-[#fff0ee] hover:text-[#b14b41]"
              >
                Delete
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function TripLogisticsBoard({ tripId }: { tripId: string }) {
  const [board, setBoard] = useState<TripLogisticsBoardDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [assigneePersonId, setAssigneePersonId] = useState("");
  const [category, setCategory] = useState<TripLogisticsCategoryValue>("OTHER");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const assigneeOptions = useMemo(
    () => board?.groups.map((group) => ({ id: group.person.id, name: group.person.name })) ?? [],
    [board]
  );

  const loadBoard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/logistics`, { cache: "no-store" });
      const result = (await response.json()) as { error?: string } & Partial<TripLogisticsBoardDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to load trip logistics.");
      }

      const nextBoard = result as TripLogisticsBoardDto;
      setBoard(nextBoard);
      setAssigneePersonId((current) => {
        if (current && nextBoard.groups.some((group) => group.person.id === current)) {
          return current;
        }

        return nextBoard.groups[0]?.person.id ?? "";
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load trip logistics.");
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  function runBoardAction(task: () => Promise<void>, key?: string) {
    if (isPending) {
      return;
    }

    setError(null);
    setPendingKey(key ?? null);

    startTransition(async () => {
      try {
        await task();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to update trip logistics.");
      } finally {
        setPendingKey(null);
      }
    });
  }

  function handleAddTask() {
    if (!board?.canManage || !title.trim() || !assigneePersonId) {
      return;
    }

    runBoardAction(async () => {
      const response = await fetch(`/api/trips/${tripId}/logistics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "manual",
          assigneePersonId,
          title: title.trim(),
          category,
          dueDate: dueDate || undefined,
          note: note.trim() || undefined,
        }),
      });
      const result = (await response.json()) as { error?: string } & Partial<TripLogisticsBoardDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to add this task.");
      }

      setBoard(result as TripLogisticsBoardDto);
      setTitle("");
      setDueDate("");
      setNote("");
      setCategory("OTHER");
    }, "new-task");
  }

  function handleAddSuggestions() {
    if (!board?.canManage) {
      return;
    }

    runBoardAction(async () => {
      const response = await fetch(`/api/trips/${tripId}/logistics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "suggestions" }),
      });
      const result = (await response.json()) as { error?: string } & Partial<TripLogisticsBoardDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to add Mara suggestions.");
      }

      setBoard(result as TripLogisticsBoardDto);
    }, "suggestions");
  }

  function handleStatusChange(taskId: string, nextStatus: TripLogisticsTaskStatusValue) {
    runBoardAction(async () => {
      const response = await fetch(`/api/trips/${tripId}/logistics/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = (await response.json()) as { error?: string } & Partial<TripLogisticsBoardDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to update this task.");
      }

      setBoard(result as TripLogisticsBoardDto);
    }, taskId);
  }

  function handleDeleteTask(taskId: string) {
    runBoardAction(async () => {
      const response = await fetch(`/api/trips/${tripId}/logistics/${taskId}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string } & Partial<TripLogisticsBoardDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to delete this task.");
      }

      setBoard(result as TripLogisticsBoardDto);
    }, taskId);
  }

  function handleTaskReminder(taskId: string) {
    runBoardAction(async () => {
      const response = await fetch(`/api/trips/${tripId}/logistics/${taskId}/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = (await response.json()) as { error?: string } & Partial<TripLogisticsBoardDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to send the reminder.");
      }

      setBoard(result as TripLogisticsBoardDto);
    }, taskId);
  }

  function handlePersonReminder(personId: string) {
    runBoardAction(async () => {
      const response = await fetch(`/api/trips/${tripId}/people/${personId}/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = (await response.json()) as { error?: string } & Partial<TripLogisticsBoardDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to send the reminder.");
      }

      setBoard(result as TripLogisticsBoardDto);
    }, personId);
  }

  function handleResendInvite(personId: string) {
    runBoardAction(async () => {
      const response = await fetch(`/api/trips/${tripId}/people/${personId}/invite`, { method: "POST" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to resend the invite.");
      }

      await loadBoard();
    }, personId);
  }

  return (
    <Card tone="solid" className="overflow-hidden p-0 shadow-[0_16px_36px_rgba(12,20,37,0.05)]">
      <div className="border-b border-[var(--card-border)] px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Trip logistics</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-[2.15rem]">
              Who still needs what.
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Keep prep work grouped by person, then let each attendee use Mara for their own part of the trip.
            </p>
          </div>

          {board?.canManage ? (
            <Button type="button" variant="secondary" onClick={handleAddSuggestions} disabled={isPending}>
              {isPending && pendingKey === "suggestions" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Add Mara suggestions
            </Button>
          ) : null}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {isLoading ? (
          <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-5 text-sm text-[var(--muted)]">
            Loading trip logistics...
          </div>
        ) : null}

        {error ? <div className="mb-4 rounded-[20px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{error}</div> : null}

        {board && board.canManage ? (
          <div className="mb-5 rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <Plus className="h-4 w-4 text-[var(--teal-700)]" />
              Add a logistics task
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_15rem_12rem]">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Task</label>
                <input
                  className="mt-2 w-full rounded-[18px] border border-[var(--card-border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(27,107,99,0.32)]"
                  value={title}
                  onChange={(event) => setTitle(event.currentTarget.value)}
                  placeholder="Book flights"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Assign to</label>
                <select
                  className="mt-2 w-full rounded-[18px] border border-[var(--card-border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(27,107,99,0.32)]"
                  value={assigneePersonId}
                  onChange={(event) => setAssigneePersonId(event.currentTarget.value)}
                >
                  {assigneeOptions.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Category</label>
                <select
                  className="mt-2 w-full rounded-[18px] border border-[var(--card-border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(27,107,99,0.32)]"
                  value={category}
                  onChange={(event) => setCategory(event.currentTarget.value as TripLogisticsCategoryValue)}
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[14rem_minmax(0,1fr)_auto]">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Due date</label>
                <input
                  type="date"
                  className="mt-2 w-full rounded-[18px] border border-[var(--card-border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(27,107,99,0.32)]"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.currentTarget.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Note</label>
                <input
                  className="mt-2 w-full rounded-[18px] border border-[var(--card-border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(27,107,99,0.32)]"
                  value={note}
                  onChange={(event) => setNote(event.currentTarget.value)}
                  placeholder="Keep it light, but book it this week."
                />
              </div>
              <div className="self-end">
                <Button type="button" onClick={handleAddTask} disabled={isPending || !title.trim() || !assigneePersonId}>
                  {isPending && pendingKey === "new-task" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add task
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {board && !board.groups.length ? (
          <div className="rounded-[24px] border border-dashed border-[var(--card-border)] bg-[var(--surface-muted)] px-4 py-5 text-sm text-[var(--muted)]">
            No trip people are attached yet.
          </div>
        ) : null}

        {board ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {board.groups.map((group) => {
              const personKey = `person:${group.person.id}`;
              const pendingPersonAction = isPending && pendingKey === personKey;

              return (
                <section key={group.person.id} className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-muted)] p-4 sm:p-5">
                  <div className="flex flex-col gap-4 border-b border-[var(--card-border)] pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-[var(--foreground)]">{group.person.name}</p>
                          <StatusPill label={formatAttendanceLabel(group.person.attendanceStatus)} className={attendancePillStyles[group.person.attendanceStatus]} />
                          <StatusPill
                            label={group.person.isOwner ? "Owner" : formatAccessLabel(group.person.plannerAccessRole)}
                            className={group.person.isOwner ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-slate-50 text-slate-600"}
                          />
                          {!group.person.isRegistered ? <StatusPill label="Pending signup" className="border-amber-200 bg-amber-50 text-amber-700" /> : null}
                        </div>
                        <p className="mt-2 text-sm text-[var(--muted)]">{group.person.email}</p>
                      </div>

                      <div className="rounded-[18px] border border-[var(--card-border)] bg-white px-3 py-2 text-sm text-[var(--muted)]">
                        {group.completion.done} of {group.completion.total} done
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {group.person.isRegistered ? (
                        <Link href={`/dashboard?tripId=${tripId}`} className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-[var(--card-border)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[rgba(18,109,100,0.18)] hover:bg-[rgba(248,251,255,0.96)]">
                          <Route className="h-4 w-4" />
                          Open Mara
                        </Link>
                      ) : null}

                      {board.canManage ? (
                        group.person.isRegistered ? (
                          <Button type="button" variant="secondary" size="sm" onClick={() => handlePersonReminder(group.person.id)} disabled={pendingPersonAction}>
                            {pendingPersonAction ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                            Send reminder
                          </Button>
                        ) : (
                          <Button type="button" variant="secondary" size="sm" onClick={() => handleResendInvite(group.person.id)} disabled={pendingPersonAction}>
                            {pendingPersonAction ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus2 className="h-4 w-4" />}
                            Invite to join
                          </Button>
                        )
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {group.tasks.length ? (
                      group.tasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          canManage={board.canManage}
                          busy={isPending && pendingKey === task.id}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDeleteTask}
                          onRemind={handleTaskReminder}
                        />
                      ))
                    ) : (
                      <div className="rounded-[20px] border border-dashed border-[var(--card-border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                        Nothing assigned yet.
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

