import { describe, expect, it } from "vitest";

import type { TripDetailDto, TripLogisticsBoardDto } from "@/lib/contracts";
import { buildTripLiveSnapshotProposal, createEmptyTripLiveSnapshot } from "@/lib/trip-live-snapshot";
import type { TripPlannerChatMessage } from "@/lib/trip-planner-agent";

function createTrip(overrides?: Partial<TripDetailDto>): TripDetailDto {
  return {
    id: "trip-123",
    name: "Trip planner",
    isOwner: true,
    canEdit: true,
    plannerAccessRole: "EDIT",
    status: "DRAFT",
    plannerStatus: "ACTIVE",
    startingLocation: null,
    visitDate: "2026-03-20",
    simulatedTime: null,
    currentStep: 1,
    latestPlanSummary: null,
    liveSnapshot: null,
    maraChatHistory: [],
    liveSnapshotUpdatedAt: null,
    park: {
      id: "park-1",
      slug: "aurora-zoo",
      name: "Aurora Zoo",
      resort: "City Adventures",
      description: null,
      opensAt: "09:00",
      closesAt: "18:00",
    },
    partyProfile: {
      partySize: 0,
      kidsAges: [],
      thrillTolerance: "LOW",
      walkingTolerance: "MEDIUM",
      preferredRideTypes: [],
      mustDoRideIds: [],
      diningPreferences: [],
      startTime: null,
      breakStart: null,
      breakEnd: null,
    },
    itinerary: [],
    ...overrides,
  };
}

function createBoard(): TripLogisticsBoardDto {
  return {
    tripId: "trip-123",
    canManage: true,
    groups: [
      {
        person: {
          id: "person-1",
          tripId: "trip-123",
          userId: null,
          email: "traveler@example.com",
          name: "Traveler",
          attendanceStatus: "ATTENDING",
          plannerAccessRole: "VIEW",
          isOwner: false,
          isRegistered: false,
          inviteAcceptedAt: null,
          lastInvitedAt: null,
          lastRemindedAt: null,
          createdAt: "2026-03-17T00:00:00.000Z",
        },
        completion: {
          done: 0,
          total: 2,
        },
        tasks: [
          {
            id: "task-1",
            tripId: "trip-123",
            assigneePersonId: "person-1",
            title: "Confirm hotel booking",
            category: "LODGING",
            status: "TODO",
            source: "MANUAL",
            dueDate: null,
            note: null,
            reminderNote: null,
            lastRemindedAt: null,
            createdAt: "2026-03-17T00:00:00.000Z",
            updatedAt: "2026-03-17T00:00:00.000Z",
            assignee: {
              id: "person-1",
              tripId: "trip-123",
              userId: null,
              email: "traveler@example.com",
              name: "Traveler",
              attendanceStatus: "ATTENDING",
              plannerAccessRole: "VIEW",
              isOwner: false,
              isRegistered: false,
              inviteAcceptedAt: null,
              lastInvitedAt: null,
              lastRemindedAt: null,
              createdAt: "2026-03-17T00:00:00.000Z",
            },
          },
          {
            id: "task-2",
            tripId: "trip-123",
            assigneePersonId: "person-1",
            title: "Pack Real ID",
            category: "DOCS",
            status: "TODO",
            source: "MANUAL",
            dueDate: null,
            note: null,
            reminderNote: null,
            lastRemindedAt: null,
            createdAt: "2026-03-17T00:00:00.000Z",
            updatedAt: "2026-03-17T00:00:00.000Z",
            assignee: {
              id: "person-1",
              tripId: "trip-123",
              userId: null,
              email: "traveler@example.com",
              name: "Traveler",
              attendanceStatus: "ATTENDING",
              plannerAccessRole: "VIEW",
              isOwner: false,
              isRegistered: false,
              inviteAcceptedAt: null,
              lastInvitedAt: null,
              lastRemindedAt: null,
              createdAt: "2026-03-17T00:00:00.000Z",
            },
          },
        ],
      },
    ],
  };
}

function createMessages(...messages: Array<[TripPlannerChatMessage["role"], string]>): TripPlannerChatMessage[] {
  return messages.map(([role, content]) => ({ role, content }));
}

describe("buildTripLiveSnapshotProposal", () => {
  it("does not propose a snapshot update for generic continuation turns", () => {
    const proposal = buildTripLiveSnapshotProposal({
      trip: createTrip(),
      board: createBoard(),
      currentSnapshot: createEmptyTripLiveSnapshot(),
      messages: createMessages(
        ["assistant", "We can keep shaping this zoo trip."],
        ["user", "lets continue zoo trip planning"]
      ),
      reply: "Should this stay close to home, or are you open to traveling for it?",
    });

    expect(proposal).toBeNull();
  });

  it("does not propose snapshot changes from board-only logistics on unrelated turns", () => {
    const proposal = buildTripLiveSnapshotProposal({
      trip: createTrip(),
      board: createBoard(),
      currentSnapshot: createEmptyTripLiveSnapshot(),
      messages: createMessages(
        ["assistant", "I can help tighten the plan."],
        ["user", "what else do you need from me?"]
      ),
      reply: "I mainly need to know if this should stay local or become a bigger trip.",
    });

    expect(proposal).toBeNull();
  });

  it("proposes a snapshot update when the latest turn adds real trip details", () => {
    const proposal = buildTripLiveSnapshotProposal({
      trip: createTrip(),
      board: null,
      currentSnapshot: createEmptyTripLiveSnapshot(),
      messages: createMessages(
        ["assistant", "What kind of outing are you planning?"],
        ["user", "I want a zoo trip near home for me, my wife, and our 2 year old son this weekend."]
      ),
      reply: "Great. I can shape a nearby weekend zoo day for your family.",
    });

    expect(proposal).not.toBeNull();
    expect(proposal?.changes.some((change) => change.field === "activities")).toBe(true);
    expect(proposal?.changes.some((change) => change.field === "groupSummary")).toBe(true);
    expect(proposal?.changes.some((change) => change.field === "latestTakeaway")).toBe(true);
  });
});
