"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, CirclePlus, LoaderCircle, Mail, PencilLine, ShieldAlert, ShieldCheck, Trash2, UserRound, X } from "lucide-react";

import { canAccessBillingFeature } from "@/lib/billing";
import type { SubscriptionTierValue, TripCollaboratorStateDto } from "@/lib/contracts";

import { FeatureUpsellCard } from "@/components/billing/feature-upsell-card";
import { PlannerWorkflowPanel } from "@/components/trip/planner-workflow-panel";
import { Button } from "@/components/ui/button";

const inputClassName =
  "mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#1b6b63]/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

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
  const [state, setState] = useState<TripCollaboratorStateDto | null>(null);
  const [draftName, setDraftName] = useState(tripName);
  const [inviteEmail, setInviteEmail] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isCollaborationLocked = !canAccessBillingFeature(currentTier, "tripCollaboration");
  const canConfirmDelete = deleteConfirmation.trim().toLowerCase() === "delete";

  useEffect(() => {
    if (previousTripIdRef.current !== tripId) {
      previousTripIdRef.current = tripId;
      setIsOpen(false);
      setState(null);
      setDraftName(tripName);
      setInviteEmail("");
      setIsDeleteDialogOpen(false);
      setDeleteConfirmation("");
      setIsWorkflowOpen(false);
      setError(null);
      setIsLoading(false);
      setIsSavingName(false);
      setIsDeleting(false);
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

  async function loadCollaborators(force = false) {
    if ((state && !force) || isLoading || isCollaborationLocked) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/collaborators`, { cache: "no-store" });
      const result = (await response.json()) as { error?: string } & Partial<TripCollaboratorStateDto>;
      if (!response.ok || !result.tripId) {
        throw new Error(result.error || "Unable to load collaborators.");
      }

      setState(result as TripCollaboratorStateDto);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load collaborators.");
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
    if (!isCollaborationLocked) {
      void loadCollaborators(true);
    }
  }

  function closeDialog() {
    setIsOpen(false);
    setIsDeleteDialogOpen(false);
    setDraftName(tripName);
    setInviteEmail("");
    setDeleteConfirmation("");
    setIsWorkflowOpen(false);
    setError(null);
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

  async function handleSaveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = draftName.trim();
    if (trimmedName === tripName.trim()) {
      setError(null);
      return;
    }

    if (trimmedName.length < 3) {
      setError("Trip names need at least 3 characters.");
      return;
    }

    setError(null);
    setIsSavingName(true);

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
      });
      const result = (await response.json()) as { error?: string; name?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to update the planner name.");
      }

      setDraftName(result.name ?? trimmedName);
      startTransition(() => {
        router.refresh();
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update the planner name.");
    } finally {
      setIsSavingName(false);
    }
  }

  function handleInvite() {
    const email = inviteEmail.trim();
    if (!email || isPending || isCollaborationLocked) {
      return;
    }

    startTransition(async () => {
      setError(null);

      try {
        const response = await fetch(`/api/trips/${tripId}/collaborators`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });
        const result = (await response.json()) as { error?: string } & Partial<TripCollaboratorStateDto>;
        if (!response.ok || !result.tripId) {
          throw new Error(result.error || "Unable to add collaborator.");
        }

        setState(result as TripCollaboratorStateDto);
        setInviteEmail("");
      } catch (inviteError) {
        setError(inviteError instanceof Error ? inviteError.message : "Unable to add collaborator.");
      }
    });
  }

  function handleRemove(collaboratorId: string) {
    if (isPending || isCollaborationLocked) {
      return;
    }

    startTransition(async () => {
      setError(null);

      try {
        const response = await fetch(`/api/trips/${tripId}/collaborators/${collaboratorId}`, {
          method: "DELETE",
        });
        const result = (await response.json()) as { error?: string } & Partial<TripCollaboratorStateDto>;
        if (!response.ok || !result.tripId) {
          throw new Error(result.error || "Unable to remove collaborator.");
        }

        setState(result as TripCollaboratorStateDto);
      } catch (removeError) {
        setError(removeError instanceof Error ? removeError.message : "Unable to remove collaborator.");
      }
    });
  }

  async function handleDeletePlanner() {
    if (!isOwner || !canConfirmDelete || isDeleting) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string; nextPath?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to delete this planner.");
      }

      router.push(result.nextPath ?? "/dashboard");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete this planner.");
      setIsDeleting(false);
    }
  }

  const collaboratorsCount = state?.collaborators.length ?? 0;

  return (
    <>
      {triggerMode === "icon" ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-10 w-10 rounded-full px-0"
          onClick={openDialog}
          aria-label="Edit planner"
        >
          <PencilLine className="h-4 w-4" />
        </Button>
      ) : (
        <Button type="button" variant="secondary" className="gap-2" onClick={openDialog}>
          <PencilLine className="h-4 w-4" />
          Edit planner
        </Button>
      )}

      {isOpen
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/30 px-4 py-4 backdrop-blur-[4px] sm:items-center sm:py-6" onClick={closeDialog}>
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Edit planner"
                className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,255,0.96))] shadow-[0_30px_90px_rgba(15,23,42,0.2)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="dialog-scroll soft-scrollbar max-h-[90vh] overflow-y-auto p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Planner settings</p>
                <h2 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
                  Manage this planner
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Update the planner name, manage who can work on it, or remove it entirely if this trip is no longer needed.
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
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      This updates the planner title everywhere it appears, including the workspace tab.
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                    {isOwner ? "Owner" : "Collaborator"}
                  </span>
                </div>

                <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSaveName}>
                  <div className="min-w-0 flex-1">
                    <label className="block text-sm font-medium text-slate-700" htmlFor={`trip-name-${tripId}`}>
                      Planner name
                    </label>
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
                      disabled={isSavingName || isDeleting}
                    />
                  </div>
                  <Button type="submit" disabled={isSavingName || isDeleting} className="sm:mb-0.5">
                    {isSavingName ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save name"
                    )}
                  </Button>
                </form>
              </section>

              <section className="rounded-[28px] border border-[var(--card-border)] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-5 shadow-[0_10px_24px_rgba(12,20,37,0.04)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Shared access</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">People on this planner</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Keep collaborators in one place so everyone planning the same trip can stay aligned.
                    </p>
                  </div>
                  {!isCollaborationLocked ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                      {collaboratorsCount} added
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Pro
                    </span>
                  )}
                </div>

                {isCollaborationLocked ? (
                  <div className="mt-6 space-y-6">
                    <FeatureUpsellCard currentTier={currentTier} feature="tripCollaboration" />
                    <p className="text-sm leading-7 text-slate-600">
                      Collaboration stays visible here so you can see how shared planning works, but inviting other users requires Pro.
                    </p>
                  </div>
                ) : isLoading && !state ? (
                  <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading planner access...
                  </div>
                ) : state ? (
                  <div className="mt-6 space-y-5">
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Owner</p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-cyan-50 text-teal-700">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">{state.owner.name}</p>
                          <p className="text-sm text-slate-500">{state.owner.email}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      {state.collaborators.length ? (
                        <div className="space-y-3">
                          {state.collaborators.map((collaborator) => (
                            <div key={collaborator.id} className="flex items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-slate-500">
                                  <UserRound className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-950">{collaborator.name}</p>
                                  <p className="truncate text-sm text-slate-500">{collaborator.email}</p>
                                </div>
                              </div>
                              {state.canManage ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemove(collaborator.id)}
                                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-[#efc1bc] hover:text-[#b14b41]"
                                  aria-label={`Remove ${collaborator.name}`}
                                  disabled={isPending || isDeleting}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm leading-7 text-slate-600">No collaborators have been added yet.</p>
                      )}
                    </div>

                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Invite by email</p>
                      {state.canManage ? (
                        <>
                          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor={`trip-collaborator-email-${tripId}`}>
                            Add an existing Parqara user
                          </label>
                          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="min-w-0 flex-1">
                              <div className="relative">
                                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                  id={`trip-collaborator-email-${tripId}`}
                                  type="email"
                                  value={inviteEmail}
                                  onChange={(event) => setInviteEmail(event.currentTarget.value)}
                                  placeholder="teammate@example.com"
                                  className={`${inputClassName} pl-11`}
                                  disabled={isPending || isDeleting}
                                />
                              </div>
                            </div>
                            <Button type="button" onClick={handleInvite} disabled={isPending || isDeleting || !inviteEmail.trim()}>
                              {isPending ? (
                                <>
                                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <CirclePlus className="mr-2 h-4 w-4" />
                                  Add collaborator
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="mt-3 text-xs leading-6 text-slate-500">
                            The email has to belong to an existing Parqara account. Added collaborators can open and edit this planner.
                          </p>
                        </>
                      ) : (
                        <p className="mt-4 text-sm leading-7 text-slate-600">
                          Only the trip owner can change access. You can still see who is collaborating on this planner.
                        </p>
                      )}
                    </div>
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
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Delete this planner if it is no longer needed. This permanently removes the planner and its collaborator access.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={openDeleteDialog}
                      className="shrink-0 rounded-full border border-[#efc1bc] bg-white text-[#b14b41] hover:border-[#d9a19b] hover:bg-[#fff0ee] hover:text-[#98372f]"
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
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
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        This permanently removes the planner, its itinerary, saved details, and collaborator access.
                      </p>
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
                  <input
                    id={`trip-delete-confirm-${tripId}`}
                    type="text"
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.currentTarget.value)}
                    placeholder="delete"
                    className={inputClassName}
                    disabled={isDeleting}
                  />
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-6 text-slate-500">You will be returned to the dashboard after deletion.</p>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="ghost" onClick={closeDeleteDialog} disabled={isDeleting}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="border-[#b14b41] bg-[#b14b41] text-white shadow-none hover:bg-[#98372f]"
                      disabled={!canConfirmDelete || isDeleting}
                      onClick={handleDeletePlanner}
                    >
                      {isDeleting ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete planner
                        </>
                      )}
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






