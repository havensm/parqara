"use client";

import { LoaderCircle, Mail, Trash2, UserRound } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import type { ProfilePeopleStateDto } from "@/lib/contracts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const inputClassName =
  "mt-2 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#1b6b63]/40";

export function ProfilePeopleManager() {
  const [state, setState] = useState<ProfilePeopleStateDto | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadPeople() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/profile/people", { cache: "no-store" });
        const result = (await response.json()) as ProfilePeopleStateDto & { error?: string };
        if (!response.ok) {
          throw new Error(result.error || "Unable to load your saved contacts.");
        }

        if (!cancelled) {
          setState(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load your saved contacts.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPeople();
    return () => {
      cancelled = true;
    };
  }, []);

  function addPerson() {
    const nextEmail = email.trim();
    if (!nextEmail || isPending) {
      return;
    }

    startTransition(async () => {
      setError(null);
      setMessage(null);

      try {
        const response = await fetch("/api/profile/people", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: nextEmail }),
        });
        const result = (await response.json()) as ProfilePeopleStateDto & { error?: string };
        if (!response.ok) {
          throw new Error(result.error || "Unable to add this person.");
        }

        setState(result);
        setEmail("");
        setMessage("Saved to your contacts.");
      } catch (addError) {
        setError(addError instanceof Error ? addError.message : "Unable to add this person.");
      }
    });
  }

  function removePerson(personId: string) {
    if (isPending) {
      return;
    }

    startTransition(async () => {
      setError(null);
      setMessage(null);

      try {
        const response = await fetch(`/api/profile/people/${personId}`, {
          method: "DELETE",
        });
        const result = (await response.json()) as ProfilePeopleStateDto & { error?: string };
        if (!response.ok) {
          throw new Error(result.error || "Unable to remove this person.");
        }

        setState(result);
      } catch (removeError) {
        setError(removeError instanceof Error ? removeError.message : "Unable to remove this person.");
      }
    });
  }

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
            Saved contacts
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Add people once and reuse them in future planners.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <label className="block text-sm font-medium text-slate-700" htmlFor="profile-people-email">
          Add by email
        </label>
        <div className="mt-3 flex flex-col gap-3">
          <div className="min-w-0 flex-1">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="profile-people-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder="friend@example.com"
                className={`${inputClassName} pl-11`}
              />
            </div>
          </div>
          <Button type="button" onClick={addPerson} disabled={isPending || !email.trim()} className="w-full justify-center">
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading your saved contacts...
        </div>
      ) : null}

      {!isLoading && state ? (
        <div className="mt-5 space-y-3">
          {state.people.length ? (
            state.people.map((person) => (
              <div key={person.id} className="flex items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-cyan-50 text-teal-700">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{person.name}</p>
                    <p className="truncate text-sm text-slate-500">{person.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removePerson(person.id)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-[#efc1bc] hover:text-[#b14b41]"
                  aria-label={`Remove ${person.name}`}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
              No saved contacts yet.
            </div>
          )}
        </div>
      ) : null}

      {message ? <p className="mt-4 text-sm font-semibold text-[#18544d]">{message}</p> : null}
      {error ? <p className="mt-4 text-sm font-semibold text-[#b14b41]">{error}</p> : null}
    </Card>
  );
}


