"use client";

import { useEffect, useState, useTransition } from "react";
import { CirclePlus, LoaderCircle, Mail, ShieldCheck, Trash2, UserRound, X } from "lucide-react";

import { canAccessBillingFeature } from "@/lib/billing";
import type { SubscriptionTierValue, TripCollaboratorStateDto } from "@/lib/contracts";

import { FeatureUpsellCard } from "@/components/billing/feature-upsell-card";
import { Button } from "@/components/ui/button";

const inputClassName =
  "mt-2 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#1b6b63]/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export function TripCollaboratorManager({
  currentTier,
  tripId,
  label = "People",
}: {
  currentTier: SubscriptionTierValue;
  tripId: string;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<TripCollaboratorStateDto | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isLocked = !canAccessBillingFeature(currentTier, "tripCollaboration");

  useEffect(() => {
    setIsOpen(false);
    setState(null);
    setInviteEmail("");
    setError(null);
    setIsLoading(false);
  }, [tripId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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
  }, [isOpen]);

  async function loadCollaborators(force = false) {
    if ((state && !force) || isLoading || isLocked) {
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
    if (!isLocked) {
      void loadCollaborators();
    }
  }

  function closeDialog() {
    setIsOpen(false);
    setError(null);
    setInviteEmail("");
  }

  function handleInvite() {
    const email = inviteEmail.trim();
    if (!email || isPending || isLocked) {
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
    if (isPending || isLocked) {
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

  const peopleCount = 1 + (state?.collaborators.length ?? 0);

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:border-[#bfd4cb] hover:bg-slate-50 hover:text-slate-950"
        aria-label="Manage collaborators"
      >
        <CirclePlus className="h-4 w-4" />
        <span>{label}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{peopleCount}</span>
        {isLocked ? <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Pro</span> : null}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6" onClick={closeDialog}>
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/60 bg-[linear-gradient(180deg,#fdfefe_0%,#f8fafc_100%)] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.24)] sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Collaborators</p>
                <h2 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
                  Manage trip access
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                  Add people who should help shape this trip. Collaborators can open the planner, update details, and work with Mara on the same trip.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-950"
                aria-label="Close collaborator dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLocked ? (
              <div className="mt-8 space-y-6">
                <FeatureUpsellCard currentTier={currentTier} feature="tripCollaboration" />
                <section className="rounded-[26px] border border-slate-200 bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Invite by email</p>
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
                          disabled
                          value={inviteEmail}
                          onChange={(event) => setInviteEmail(event.currentTarget.value)}
                          placeholder="teammate@example.com"
                          className={`${inputClassName} pl-11`}
                        />
                      </div>
                    </div>
                    <Button type="button" disabled>
                      Add collaborator
                    </Button>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-slate-500">
                    Shared workspaces stay visible in the UI here, but Pro is required before invitations can be sent.
                  </p>
                </section>
              </div>
            ) : null}

            {isLoading && !state && !isLocked ? (
              <div className="mt-8 flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading access list...
              </div>
            ) : null}

            {state && !isLocked ? (
              <div className="mt-8 space-y-6">
                <section className="rounded-[26px] border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
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
                    <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700">
                      Full access
                    </span>
                  </div>
                </section>

                <section className="rounded-[26px] border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Collaborators</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-950">People on this trip</h3>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                      {state.collaborators.length} added
                    </span>
                  </div>

                  {state.collaborators.length ? (
                    <div className="mt-5 space-y-3">
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
                              disabled={isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-5 text-sm leading-7 text-slate-600">No collaborators have been added yet.</p>
                  )}
                </section>

                <section className="rounded-[26px] border border-slate-200 bg-white p-5">
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
                            />
                          </div>
                        </div>
                        <Button type="button" onClick={handleInvite} disabled={isPending || !inviteEmail.trim()}>
                          {isPending ? "Saving..." : "Add collaborator"}
                        </Button>
                      </div>
                      <p className="mt-3 text-xs leading-6 text-slate-500">
                        The email has to belong to an existing Parqara account. Added collaborators can open and edit this trip.
                      </p>
                    </>
                  ) : (
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      Only the trip owner can change access. You can still see who is collaborating on this planner.
                    </p>
                  )}
                </section>
              </div>
            ) : null}

            {error ? <p className="mt-6 rounded-[22px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
