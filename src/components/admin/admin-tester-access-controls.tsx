"use client";

import { SubscriptionStatus, SubscriptionTier } from "@prisma/client/index";
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
  }>;
};

function formatStatusLabel(status: SubscriptionStatus) {
  return status.replaceAll("_", " ").toLowerCase();
}

export function AdminTesterAccessControls({ recentUsers }: AdminTesterAccessControlsProps) {
  const [email, setEmail] = useState("");
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(SubscriptionTier.PRO);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedRecentUser = useMemo(
    () => recentUsers.find((user) => user.email.toLowerCase() === email.trim().toLowerCase()) ?? null,
    [email, recentUsers]
  );

  function handleSubmit() {
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
            email,
            subscriptionTier,
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
          throw new Error(result.error || "Unable to update tester access.");
        }

        setEmail(result.email);
        setMessage(
          subscriptionTier === SubscriptionTier.FREE
            ? `${result.name ?? result.email} is back on Free.`
            : `${result.name ?? result.email} now has ${result.subscriptionTier} access without Stripe checkout.`
        );
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Unable to update tester access.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="info">Admin-only manual access</Badge>
        <Badge variant="warning">No Stripe checkout required</Badge>
      </div>

      <p className="text-sm leading-7 text-slate-600">
        Grant Plus or Pro to testers by email. Choosing Free resets them to the normal free plan. This changes the live billing fields immediately.
      </p>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Tester email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tester@example.com"
            className="h-12 w-full rounded-[20px] border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#1b6b63]/40"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Plan to grant</span>
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
          <p className="mt-2 text-sm text-slate-500">Current user match for this email.</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={handleSubmit} disabled={isPending || !email.trim()}>
          {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <UserRoundPlus className="mr-2 h-4 w-4" />}
          {subscriptionTier === SubscriptionTier.FREE ? "Reset to Free" : `Grant ${subscriptionTier}`}
        </Button>
      </div>

      <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Sparkles className="h-4 w-4 text-teal-700" />
          Recent users
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {recentUsers.map((user) => (
            <button
              key={user.email}
              type="button"
              onClick={() => setEmail(user.email)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#bfd4cb] hover:text-slate-950"
            >
              {user.email}
            </button>
          ))}
        </div>
      </div>

      {message ? <p className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-[20px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{error}</p> : null}
    </div>
  );
}
