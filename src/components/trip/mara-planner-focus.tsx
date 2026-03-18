"use client";

import Link from "next/link";
import { FileText, Radio, Route } from "lucide-react";

import { canAccessBillingFeature } from "@/lib/billing";
import type { SubscriptionTierValue, TripDetailDto } from "@/lib/contracts";
import { type TripPlannerTripContext } from "@/lib/trip-planner-agent";
import { isPlannerKickoffDraft } from "@/lib/trip-workspace";

import { TripPlannerConcierge } from "@/components/assistant/trip-planner-concierge";
import { FeatureUpsellCard } from "@/components/billing/feature-upsell-card";
import { TripPlannerSettingsDialog } from "@/components/trip/trip-planner-settings-dialog";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function TripDetailsHandoff({ trip }: { trip: TripDetailDto }) {
  return (
    <Card
      tone="solid"
      className="shrink-0 rounded-[28px] border-[rgba(206,220,241,0.92)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,250,255,0.94))] p-4 shadow-[0_18px_38px_rgba(12,20,37,0.06)] sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Trip details</p>
          <p className="mt-1 text-sm text-[var(--muted)]">The live report and logistics update outside the chat.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/trips/${trip.id}`} className={buttonStyles({ variant: "secondary", size: "sm" })}>
            <FileText className="mr-2 h-4 w-4" />
            Trip details
          </Link>
          {trip.itinerary.length ? (
            <Link href={`/trips/${trip.id}/itinerary`} className={buttonStyles({ variant: "ghost", size: "sm" })}>
              <Route className="mr-2 h-4 w-4" />
              Itinerary
            </Link>
          ) : null}
          {trip.status !== "DRAFT" ? (
            <Link href={`/trips/${trip.id}/live`} className={buttonStyles({ variant: "ghost", size: "sm" })}>
              <Radio className="mr-2 h-4 w-4" />
              Live mode
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function MaraPlannerFocus({
  currentTier,
  firstName,
  tripId,
  trip,
  tripContext,
  questions = [],
}: {
  currentTier: SubscriptionTierValue;
  firstName?: string | null;
  tripId: string;
  trip: TripDetailDto;
  tripContext?: TripPlannerTripContext;
  questions?: string[];
  approximateLocation?: string | null;
}) {
  const starterMode = isPlannerKickoffDraft({
    status: trip.status,
    currentStep: trip.currentStep,
    itineraryCount: trip.itinerary.length,
  });
  const hasMaraAccess = canAccessBillingFeature(currentTier, "aiConcierge");

  if (!hasMaraAccess) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4" data-testid="mara-planner-focus">
        <FeatureUpsellCard
          feature="aiConcierge"
          currentTier={currentTier}
          actionHref="/pricing"
          className="rounded-[32px]"
        />
        <Card tone="solid" className="rounded-[28px] p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Free planning</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-[2.15rem]">
            Fill this planner manually.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Trip details, logistics, shared planning, and itinerary building still work on Free. Upgrade when you want Mara to shape the plan for you.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/trips/${trip.id}`} className={buttonStyles({ variant: "primary", size: "default" })}>
              Open trip details
            </Link>
            <Link href="/pricing" className={buttonStyles({ variant: "secondary", size: "default" })}>
              See Mara plans
            </Link>
          </div>
        </Card>
        <TripDetailsHandoff trip={trip} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4" data-testid="mara-planner-focus">
      <TripPlannerConcierge
        currentTier={currentTier}
        firstName={firstName}
        tripId={tripId}
        tripContext={tripContext}
        initialMessages={trip.maraChatHistory}
        canResetConversation={trip.canEdit}
        questions={questions}
        priorityMode
        refreshOnReply
        starterMode={starterMode}
        fillAvailableHeight
        headerAction={
          <TripPlannerSettingsDialog
            currentTier={currentTier}
            tripId={trip.id}
            tripName={trip.name}
            isOwner={trip.isOwner}
            triggerMode="icon"
          />
        }
      />

      <TripDetailsHandoff trip={trip} />
    </div>
  );
}
