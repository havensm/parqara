"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, LoaderCircle, Mail, PencilLine, RotateCcw, ShieldAlert, Trash2, UserPlus2, UserRound, X } from "lucide-react";

import type {
  SubscriptionTierValue,
  TripAccessRoleValue,
  TripAttendanceStatusValue,
  TripPeopleStateDto,
  TripPersonDto,
} from "@/lib/contracts";

import { PlannerWorkflowPanel } from "@/components/trip/planner-workflow-panel";
import { Button } from "@/components/ui/button";

const inputClassName =
  "mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#1b6b63]/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
const selectClassName =
  "mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#1b6b63]/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const attendanceOptions: Array<{ value: TripAttendanceStatusValue; label: string }> = [
  { value: "INVITED", label: "Invited" },
  { value: "ATTENDING", label: "Attending" },
  { value: "MAYBE", label: "Maybe" },
  { value: "NOT_ATTENDING", label: "Not attending" },
];

const accessOptions: Array<{ value: TripAccessRoleValue; label: string }> = [
  { value: "NONE", label: "No planner access" },
  { value: "VIEW", label: "View" },
  { value: "EDIT", label: "Edit" },
];

const attendanceBadgeStyles: Record<TripAttendanceStatusValue, string> = {
  INVITED: "border-slate-200 bg-slate-50 text-slate-600",
  ATTENDING: "border-teal-200 bg-teal-50 text-teal-700",
  MAYBE: "border-amber-200 bg-amber-50 text-amber-700",
  NOT_ATTENDING: "border-rose-200 bg-rose-50 text-rose-700",
};

const accessBadgeStyles: Record<TripAccessRoleValue, string> = {
  NONE: "border-slate-200 bg-slate-50 text-slate-500",
  VIEW: "border-cyan-200 bg-cyan-50 text-cyan-700",
  EDIT: "border-teal-200 bg-teal-50 text-teal-700",
};

function formatAttendanceLabel(value: TripAttendanceStatusValue) {
  return attendanceOptions.find((option) => option.value === value)?.label ?? value;
}

function formatAccessLabel(value: TripAccessRoleValue) {
  return accessOptions.find((option) => option.value === value)?.label ?? value;
}

function StatusBadge({ label, className }: { label: string; className: string }) {
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${className}`}>{label}</span>;
}

function PersonRow({
  person,
  canManage,
  isBusy,
  onUpdate,
  onRemove,
  onResendInvite,
  onSendReminder,
}: {
  person: TripPersonDto;
  canManage: boolean;
  isBusy: boolean;
  onUpdate: (personId: string, patch: { attendanceStatus?: TripAttendanceStatusValue; plannerAccessRole?: TripAccessRoleValue }) => void;
  onRemove: (personId: string) => void;
  onResendInvite: (personId: string) => void;
  onSendReminder: (personId: string) => void;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-slate-500 shadow-[0_8px_18px_rgba(12,20,37,0.04)]">
              <UserRound className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-950">{person.name}</p>
              <p className="truncate text-sm text-slate-500">{person.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge label={formatAttendanceLabel(person.attendanceStatus)} className={attendanceBadgeStyles[person.attendanceStatus]} />
                <StatusBadge label={formatAccessLabel(person.plannerAccessRole)} className={accessBadgeStyles[person.plannerAccessRole]} />
                {!person.isRegistered ? <StatusBadge label="Pending signup" className="border-amber-200 bg-amber-50 text-amber-700" /> : null}
              </div>
            </div>
          </div>
        </div>

        {canManage ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[21rem]">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Attendance</label>
              <select
                className={selectClassName}
                value={person.attendanceStatus}
                onChange={(event) => onUpdate(person.id, { attendanceStatus: event.currentTarget.value as TripAttendanceStatusValue })}
                disabled={isBusy}
              >
                {attendanceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Planner access</label>
              <select
                className={selectClassName}
                value={person.plannerAccessRole}
                onChange={(event) => onUpdate(person.id, { plannerAccessRole: event.currentTarget.value as TripAccessRoleValue })}
                disabled={isBusy}
              >
                {accessOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </div>

      {canManage ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {!person.isRegistered ? (
            <Button type="button" variant="secondary" size="sm" onClick={() => onResendInvite(person.id)} disabled={isBusy}>
              <RotateCcw className="h-4 w-4" />
              Resend invite
            </Button>
          ) : (
            <Button type="button" variant="secondary" size="sm" onClick={() => onSendReminder(person.id)} disabled={isBusy}>
              <Mail className="h-4 w-4" />
              Send reminder
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(person.id)} disabled={isBusy} className="text-[#b14b41] hover:bg-[#fff0ee] hover:text-[#b14b41]">
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function TripPlannerSettingsDialog({
  currentTier,
  tripId,
  tripName,
  isOwner,
  triggerMode = "button",
}: {
  currentTier: SubscriptionTierValue;
  tripId: string;
  tripName: string;
  isOwner: boolean;
  triggerMode?: "button" | "icon";
}) {
  const router = useRouter();
  const previousTripIdRef = useRef(tripId);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [state, setState] = useState<TripPeopleStateDto | null>(null);
  const [draftName, setDraftName] = useState(tripName);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteAttendance, setInviteAttendance] = useState<TripAttendanceStatusValue>("ATTENDING");
  const [inviteAccess, setInviteAccess] = useState<TripAccessRoleValue>("VIEW");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingPersonId, setPendingPersonId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canConfirmDelete = deleteConfirmation.trim().toLowerCase() === "delete";
  const canManage = state?.canManage ?? false;

  useEffect(() => {
    if (previousTripIdRef.current !== tripId) {
      previousTripIdRef.current = tripId;
      setIsOpen(false);
      setState(null);
      setDraftName(tripName);
      setInviteEmail("");
      setInviteName("");
      setInviteAttendance("ATTENDING");
      setInviteAccess("VIEW");
      setIsDeleteDialogOpen(false);
      setDeleteConfirmation("");
      setIsWorkflowOpen(false);
      setError(null);
      setIsLoading(false);
      setIsSavingName(false);
      setIsDeleting(false);
      setPendingPersonId(null);
      return;
    }

    if (!isOpen) {
      setDraftName(tripName);
    }
  }, [isOpen, tripId, tripName]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isDeleteDialogOpen) {
          setIsDeleteDialogOpen(false);
          return;
        }

        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isDeleteDialogOpen, isOpen]);

  async function loadPeople(force = false) {
    if ((state && !force) || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/people`, { cache: "no-store" });
      const result = (await response.json()) as { error?: string } & Partial<TripPeopleStateDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to load trip people.");
      }

      setState(result as TripPeopleStateDto);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load trip people.");
    } finally {
      setIsLoading(false);
    }
  }

  function openDialog() {
    setIsOpen(true);
    setDraftName(tripName);
    setError(null);
    setIsDeleteDialogOpen(false);
    setDeleteConfirmation("");
    setIsWorkflowOpen(false);
    void loadPeople(true);
  }

  function closeDialog() {
    setIsOpen(false);
    setIsDeleteDialogOpen(false);
    setDraftName(tripName);
    setInviteEmail("");
    setInviteName("");
    setInviteAttendance("ATTENDING");
    setInviteAccess("VIEW");
    setDeleteConfirmation("");
    setIsWorkflowOpen(false);
    setError(null);
  }

  function runStateAction(task: () => Promise<void>, personId?: string) {
    if (isPending) {
      return;
    }

    setError(null);
    setPendingPersonId(personId ?? null);

    startTransition(async () => {
      try {
        await task();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to update this planner.");
      } finally {
        setPendingPersonId(null);
      }
    });
  }

  async function handleSaveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) {
      return;
    }

    const trimmedName = draftName.trim();
    if (trimmedName === tripName.trim()) {
      setError(null);
      return;
    }

    if (trimmedName.length < 3) {
      setError("Planner names need at least 3 characters.");
      return;
    }

    setError(null);
    setIsSavingName(true);

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const result = (await response.json()) as { error?: string; name?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to update the planner name.");
      }

      setDraftName(result.name ?? trimmedName);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update the planner name.");
    } finally {
      setIsSavingName(false);
    }
  }

  function handleAddPerson() {
    const email = inviteEmail.trim();
    if (!email || !canManage || isPending) {
      return;
    }

    runStateAction(async () => {
      const response = await fetch(`/api/trips/${tripId}/people`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: inviteName.trim() || undefined,
          attendanceStatus: inviteAttendance,
          plannerAccessRole: inviteAccess,
        }),
      });
      const result = (await response.json()) as { error?: string } & Partial<TripPeopleStateDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to add this person.");
      }

      setState(result as TripPeopleStateDto);
      setInviteEmail("");
      setInviteName("");
      setInviteAttendance("ATTENDING");
      setInviteAccess("VIEW");
    });
  }

  function handleUpdatePerson(personId: string, patch: { attendanceStatus?: TripAttendanceStatusValue; plannerAccessRole?: TripAccessRoleValue }) {
    if (!canManage) {
      return;
    }

    runStateAction(async () => {
      const response = await fetch(`/api/trips/${tripId}/people/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const result = (await response.json()) as { error?: string } & Partial<TripPeopleStateDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to update this person.");
      }

      setState(result as TripPeopleStateDto);
      router.refresh();
    }, personId);
  }

  function handleRemovePerson(personId: string) {
    if (!canManage) {
      return;
    }

    runStateAction(async () => {
      const response = await fetch(`/api/trips/${tripId}/people/${personId}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string } & Partial<TripPeopleStateDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to remove this person.");
      }

      setState(result as TripPeopleStateDto);
      router.refresh();
    }, personId);
  }

  function handleResendInvite(personId: string) {
    if (!canManage) {
      return;
    }

    runStateAction(async () => {
      const response = await fetch(`/api/trips/${tripId}/people/${personId}/invite`, { method: "POST" });
      const result = (await response.json()) as { error?: string } & Partial<TripPeopleStateDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to resend the invite.");
      }

      setState(result as TripPeopleStateDto);
    }, personId);
  }

  function handleSendReminder(personId: string) {
    if (!canManage) {
      return;
    }

    runStateAction(async () => {
      const response = await fetch(`/api/trips/${tripId}/people/${personId}/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to send the reminder.");
      }
    }, personId);
  }

  function openDeleteDialog() {
    setDeleteConfirmation("");
    setError(null);
    setIsDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    if (isDeleting) {
      return;
    }

    setDeleteConfirmation("");
    setIsDeleteDialogOpen(false);
  }

  async function handleDeletePlanner() {
    if (!isOwner || !canConfirmDelete || isDeleting) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string; nextPath?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to delete this planner.");
      }

      router.push(result.nextPath ?? "/dashboard");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete this planner.");
      setIsDeleting(false);
    }
  }

  return (
    <>
      {triggerMode === "icon" ? (
        <Button type="button" variant="secondary" size="sm" className="h-10 w-10 rounded-full px-0" onClick={openDialog} aria-label="Planner settings">
          <PencilLine className="h-4 w-4" />
        </Button>
      ) : (
        <Button type="button" variant="secondary" className="gap-2" onClick={openDialog}>
          <PencilLine className="h-4 w-4" />
          Planner settings
        </Button>
      )}

      {isOpen
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/30 px-4 py-4 backdrop-blur-[4px] sm:items-center sm:py-6" onClick={closeDialog}>
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Planner settings"
                className="w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,255,0.96))] shadow-[0_30px_90px_rgba(15,23,42,0.2)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="dialog-scroll soft-scrollbar max-h-[90vh] overflow-y-auto p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Planner settings</p>
                      <h2 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">Manage this planner</h2>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                        Keep the planner name tight, manage who is attending, and separate shared edit access from personal follow-through.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeDialog}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-950"
                      aria-label="Close planner settings dialog"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-8 space-y-6">
                    <section className="rounded-[28px] border border-[var(--card-border)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-5 shadow-[0_10px_24px_rgba(12,20,37,0.04)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Planner details</p>
                          <h3 className="mt-2 text-xl font-semibold text-slate-950">Rename this planner</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">Use one clear trip title. Mara can work out the rest.</p>
                        </div>
                        <StatusBadge label={isOwner ? "Owner" : canManage ? "Edit access" : "Read only"} className={isOwner || canManage ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-slate-50 text-slate-600"} />
                      </div>

                      <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSaveName}>
                        <div className="min-w-0 flex-1">
                          <label className="block text-sm font-medium text-slate-700" htmlFor={`trip-name-${tripId}`}>Planner name</label>
                          <input
                            id={`trip-name-${tripId}`}
                            type="text"
                            value={draftName}
                            onChange={(event) => {
                              setDraftName(event.currentTarget.value);
                              if (error) {
                                setError(null);
                              }
                            }}
                            className={inputClassName}
                            maxLength={80}
                            disabled={!canManage || isSavingName || isDeleting}
                          />
                        </div>
                        <Button type="submit" disabled={!canManage || isSavingName || isDeleting} className="sm:mb-0.5">
                          {isSavingName ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save name"}
                        </Button>
                      </form>
                    </section>

                    <section className="rounded-[28px] border border-[var(--card-border)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-5 shadow-[0_10px_24px_rgba(12,20,37,0.04)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">People</p>
                          <h3 className="mt-2 text-xl font-semibold text-slate-950">Roster and access</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">Attendance says who this trip is for. Planner access says who can open or edit the shared workspace.</p>
                        </div>
                        {state ? <StatusBadge label={`${1 + state.people.length} total`} className="border-slate-200 bg-slate-50 text-slate-600" /> : null}
                      </div>

                      {isLoading && !state ? (
                        <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Loading trip roster...
                        </div>
                      ) : state ? (
                        <div className="mt-6 space-y-5">
                          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Owner</p>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-950">{state.owner.name}</p>
                                <p className="text-sm text-slate-500">{state.owner.email}</p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <StatusBadge label="Owner" className="border-teal-200 bg-teal-50 text-teal-700" />
                                <StatusBadge label={formatAttendanceLabel(state.owner.attendanceStatus)} className={attendanceBadgeStyles[state.owner.attendanceStatus]} />
                              </div>
                            </div>
                          </div>

                          {state.people.length ? (
                            <div className="space-y-3">
                              {state.people.map((person) => (
                                <PersonRow
                                  key={person.id}
                                  person={person}
                                  canManage={canManage}
                                  isBusy={isPending && pendingPersonId === person.id}
                                  onUpdate={handleUpdatePerson}
                                  onRemove={handleRemovePerson}
                                  onResendInvite={handleResendInvite}
                                  onSendReminder={handleSendReminder}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">No one else has been added yet.</div>
                          )}

                          {canManage ? (
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                                <UserPlus2 className="h-4 w-4" />
                                Add someone
                              </div>
                              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                <div>
                                  <label className="block text-sm font-medium text-slate-700" htmlFor={`trip-person-email-${tripId}`}>Email</label>
                                  <input id={`trip-person-email-${tripId}`} type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.currentTarget.value)} placeholder="traveler@example.com" className={inputClassName} disabled={isPending || isDeleting} />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-700" htmlFor={`trip-person-name-${tripId}`}>Name (optional)</label>
                                  <input id={`trip-person-name-${tripId}`} type="text" value={inviteName} onChange={(event) => setInviteName(event.currentTarget.value)} placeholder="Alex" className={inputClassName} disabled={isPending || isDeleting} />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-700">Attendance</label>
                                  <select className={selectClassName} value={inviteAttendance} onChange={(event) => setInviteAttendance(event.currentTarget.value as TripAttendanceStatusValue)} disabled={isPending || isDeleting}>
                                    {attendanceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-700">Planner access</label>
                                  <select className={selectClassName} value={inviteAccess} onChange={(event) => setInviteAccess(event.currentTarget.value as TripAccessRoleValue)} disabled={isPending || isDeleting}>
                                    {accessOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                <p className="text-xs leading-6 text-slate-500">Pending emails are invited now and attach automatically after signup.</p>
                                <Button type="button" onClick={handleAddPerson} disabled={isPending || isDeleting || !inviteEmail.trim()}>
                                  {isPending && !pendingPersonId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus2 className="h-4 w-4" />}
                                  Add to trip
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">You can see who is attending and what access they have, but only editors can change the roster.</div>
                          )}
                        </div>
                      ) : null}
                    </section>

                    <section className="rounded-[24px] border border-[var(--card-border)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] shadow-[0_10px_24px_rgba(12,20,37,0.04)]">
                      <button
                        type="button"
                        onClick={() => setIsWorkflowOpen((open) => !open)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                        aria-expanded={isWorkflowOpen}
                        aria-controls={`planner-workflow-${tripId}`}
                      >
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Workflow tools</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">Duplicate, archive, or save templates only when you need them.</p>
                        </div>
                        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition ${isWorkflowOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isWorkflowOpen ? (
                        <div id={`planner-workflow-${tripId}`} className="border-t border-[var(--card-border)] px-4 pb-4 pt-1 sm:px-5 sm:pb-5">
                          <PlannerWorkflowPanel currentTier={currentTier} tripId={tripId} tripName={draftName.trim() || tripName} isOwner={isOwner} compact />
                        </div>
                      ) : null}
                    </section>

                    {isOwner ? (
                      <section className="rounded-[24px] border border-[var(--card-border)] bg-[rgba(247,250,255,0.96)] px-4 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Danger zone</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Delete this planner if it is no longer needed. This permanently removes the planner, its logistics, and the shared access list.</p>
                          </div>
                          <Button type="button" variant="ghost" onClick={openDeleteDialog} className="shrink-0 rounded-full border border-[#efc1bc] bg-white text-[#b14b41] hover:border-[#d9a19b] hover:bg-[#fff0ee] hover:text-[#98372f]" disabled={isDeleting}>
                            <Trash2 className="h-4 w-4" />
                            Delete planner
                          </Button>
                        </div>
                      </section>
                    ) : null}
                  </div>

                  {error ? <p className="mt-6 rounded-[22px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{error}</p> : null}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {isOpen && isDeleteDialogOpen
        ? createPortal(
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm" onClick={closeDeleteDialog}>
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Delete planner confirmation"
                className="w-full max-w-lg rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,#fffdfd_0%,#fff7f5_100%)] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.26)] sm:p-7"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white text-[#b14b41]">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#b14b41]">Delete planner</p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-950">Confirm permanent deletion</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">This permanently removes the planner, its trip logistics, and the shared access list.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeDeleteDialog}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-950"
                    aria-label="Close delete planner confirmation"
                    disabled={isDeleting}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-6 rounded-[22px] border border-[#efc1bc] bg-white px-4 py-4">
                  <label className="block text-sm font-medium text-slate-700" htmlFor={`trip-delete-confirm-${tripId}`}>
                    Type <span className="font-semibold text-[#b14b41]">delete</span> to confirm
                  </label>
                  <input id={`trip-delete-confirm-${tripId}`} type="text" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.currentTarget.value)} placeholder="delete" className={inputClassName} disabled={isDeleting} />
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-6 text-slate-500">You will be returned to the dashboard after deletion.</p>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="ghost" onClick={closeDeleteDialog} disabled={isDeleting}>Cancel</Button>
                    <Button type="button" className="border-[#b14b41] bg-[#b14b41] text-white shadow-none hover:bg-[#98372f]" disabled={!canConfirmDelete || isDeleting} onClick={handleDeletePlanner}>
                      {isDeleting ? <><LoaderCircle className="h-4 w-4 animate-spin" />Deleting...</> : <><Trash2 className="h-4 w-4" />Delete planner</>}
                    </Button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
