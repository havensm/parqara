"use client";

import { SubscriptionStatus, SubscriptionTier } from "@prisma/client";
import { LoaderCircle, Sparkles, UserRoundPlus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { PlanBadge } from "@/components/billing/plan-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AdminTesterAccessControlsProps = {
  recentUsers: Array<{
    email: string;
    name: string;
    subscriptionTier: SubscriptionTier;
    subscriptionStatus: SubscriptionStatus;
    activePlannerCount: number;
  }>;
};

function formatStatusLabel(status: SubscriptionStatus) {
  return status.replaceAll("_", " ").toLowerCase();
}

export function AdminTesterAccessControls({ recentUsers }: AdminTesterAccessControlsProps) {
  const [email, setEmail] = useState("");
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(SubscriptionTier.PLUS);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedRecentUser = useMemo(
    () => recentUsers.find((user) => user.email.toLowerCase() === email.trim().toLowerCase()) ?? null,
    [email, recentUsers]
  );

  function submitTierChange(nextEmail: string, nextTier: SubscriptionTier) {
    startTransition(async () => {
      setError(null);
      setMessage(null);

      try {
        const response = await fetch("/api/admin/tester-access", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: nextEmail,
            subscriptionTier: nextTier,
          }),
        });

        const result = (await response.json()) as {
          error?: string;
          email?: string;
          name?: string;
          subscriptionTier?: SubscriptionTier;
          subscriptionStatus?: SubscriptionStatus;
        };

        if (!response.ok || !result.email || !result.subscriptionTier || !result.subscriptionStatus) {
          throw new Error(result.error || "Unable to update subscription.");
        }

        setEmail(result.email);
        setSubscriptionTier(result.subscriptionTier);
        setMessage(
          nextTier === SubscriptionTier.FREE
            ? `${result.name ?? result.email} is now on Free.`
            : `${result.name ?? result.email} now has ${result.subscriptionTier}.`
        );
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Unable to update subscription.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="info">Admin-only subscription control</Badge>
        <Badge variant="warning">Writes billing fields directly</Badge>
      </div>

      <p className="text-sm leading-7 text-slate-600">
        Move any user between Free, Plus, and Pro. Planner limits stay 1, 3, and 10, and Mara unlocks on Plus.
      </p>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">User email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            className="h-12 w-full rounded-[20px] border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#1b6b63]/40"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Plan to apply</span>
          <select
            value={subscriptionTier}
            onChange={(event) => setSubscriptionTier(event.target.value as SubscriptionTier)}
            className="h-12 w-full rounded-[20px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-[#1b6b63]/40"
          >
            <option value={SubscriptionTier.FREE}>Free</option>
            <option value={SubscriptionTier.PLUS}>Plus</option>
            <option value={SubscriptionTier.PRO}>Pro</option>
          </select>
        </label>
      </div>

      {selectedRecentUser ? (
        <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-950">{selectedRecentUser.name}</p>
            <PlanBadge tier={selectedRecentUser.subscriptionTier} />
            <Badge variant="neutral">{formatStatusLabel(selectedRecentUser.subscriptionStatus)}</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {selectedRecentUser.activePlannerCount} active planner{selectedRecentUser.activePlannerCount === 1 ? "" : "s"} right now.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => submitTierChange(email, subscriptionTier)} disabled={isPending || !email.trim()}>
          {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <UserRoundPlus className="mr-2 h-4 w-4" />}
          {subscriptionTier === SubscriptionTier.FREE ? "Move to Free" : `Set ${subscriptionTier}`}
        </Button>
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Sparkles className="h-4 w-4 text-teal-700" />
          Current users
        </div>
        <div className="mt-4 grid gap-3">
          {recentUsers.map((user) => (
            <div key={user.email} className="rounded-[20px] border border-slate-200 bg-white px-4 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-slate-950">{user.name}</p>
                    <PlanBadge tier={user.subscriptionTier} />
                    <Badge variant="neutral">{formatStatusLabel(user.subscriptionStatus)}</Badge>
                  </div>
                  <p className="mt-2 truncate text-sm text-slate-500">{user.email}</p>
                  <p className="mt-1 text-sm text-slate-500">{user.activePlannerCount} active planner{user.activePlannerCount === 1 ? "" : "s"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[SubscriptionTier.FREE, SubscriptionTier.PLUS, SubscriptionTier.PRO].map((tier) => (
                    <button
                      key={`${user.email}-${tier}`}
                      type="button"
                      onClick={() => submitTierChange(user.email, tier)}
                      disabled={isPending}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                        user.subscriptionTier === tier
                          ? "border-[#1b6b63]/25 bg-[rgba(232,246,244,0.96)] text-[#1b6b63]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-[#bfd4cb] hover:text-slate-950"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {message ? <p className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-[20px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{error}</p> : null}
    </div>
  );
}
