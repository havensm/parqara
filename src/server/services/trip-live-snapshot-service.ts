import { db } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import type {
  TripLiveSnapshotDto,
  TripLiveSnapshotProposalDto,
  TripLiveSnapshotRevisionDto,
  TripLiveSnapshotStateDto,
} from "@/lib/contracts";
import { buildTripLiveSnapshotProposal, normalizeTripLiveSnapshot } from "@/lib/trip-live-snapshot";
import type { TripPlannerChatMessage } from "@/lib/trip-planner-agent";
import { getTripDetail } from "@/server/services/trip-service";
import { getTripLogisticsBoard } from "@/server/services/trip-people-service";
import { getTripAccessContext } from "@/server/services/trip-people-service";

function buildUserDisplayName(user: { email: string; firstName: string | null; lastName: string | null; name: string | null } | null | undefined) {
  if (!user) {
    return "Parqara";
  }

  const parts = [user.firstName, user.lastName].filter((value): value is string => Boolean(value && value.trim()));
  if (parts.length) {
    return parts.join(" ");
  }

  if (user.name?.trim()) {
    return user.name.trim();
  }

  return user.email;
}

function serializeRevision(revision: {
  id: string;
  label: string;
  createdAt: Date;
  snapshot: unknown;
  createdByUser: { email: string; firstName: string | null; lastName: string | null; name: string | null } | null;
}): TripLiveSnapshotRevisionDto | null {
  const snapshot = normalizeTripLiveSnapshot(revision.snapshot);
  if (!snapshot) {
    return null;
  }

  return {
    id: revision.id,
    label: revision.label,
    createdAt: revision.createdAt.toISOString(),
    createdByName: buildUserDisplayName(revision.createdByUser),
    snapshot,
  };
}

async function getTripLiveSnapshotRecord(tripId: string) {
  return db.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      liveSnapshot: true,
      liveSnapshotUpdatedAt: true,
      liveSnapshotRevisions: {
        include: {
          createdByUser: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function getTripLiveSnapshotState(userId: string, tripId: string): Promise<TripLiveSnapshotStateDto> {
  const access = await getTripAccessContext(userId, tripId);
  const trip = await getTripLiveSnapshotRecord(tripId);
  if (!trip) {
    throw new HttpError(404, "Trip not found.");
  }

  return {
    tripId,
    canManage: access.canEdit,
    canRevert: access.isOwner,
    currentSnapshot: normalizeTripLiveSnapshot(trip.liveSnapshot),
    currentSnapshotUpdatedAt: trip.liveSnapshotUpdatedAt ? trip.liveSnapshotUpdatedAt.toISOString() : null,
    revisions: access.isOwner
      ? trip.liveSnapshotRevisions.map(serializeRevision).filter((revision): revision is TripLiveSnapshotRevisionDto => Boolean(revision))
      : [],
  };
}

export async function buildTripLiveSnapshotProposalState(
  userId: string,
  tripId: string,
  messages: TripPlannerChatMessage[],
  reply: string
): Promise<TripLiveSnapshotProposalDto | null> {
  const access = await getTripAccessContext(userId, tripId);
  if (!access.canEdit) {
    return null;
  }

  const [trip, board, snapshotState] = await Promise.all([
    getTripDetail(userId, tripId),
    getTripLogisticsBoard(userId, tripId),
    getTripLiveSnapshotState(userId, tripId),
  ]);

  return buildTripLiveSnapshotProposal({
    trip,
    board,
    messages,
    reply,
    currentSnapshot: snapshotState.currentSnapshot,
  });
}

export async function applyTripLiveSnapshot(
  userId: string,
  tripId: string,
  snapshot: TripLiveSnapshotDto,
  label = "Snapshot approved"
): Promise<TripLiveSnapshotStateDto> {
  const access = await getTripAccessContext(userId, tripId);
  if (!access.canEdit) {
    throw new HttpError(403, "You do not have edit access to this planner.");
  }

  const normalized = normalizeTripLiveSnapshot(snapshot);
  if (!normalized) {
    throw new HttpError(400, "Snapshot payload is invalid.");
  }

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.trip.update({
      where: { id: tripId },
      data: {
        liveSnapshot: normalized,
        liveSnapshotUpdatedAt: now,
      },
    });

    await tx.tripLiveSnapshotRevision.create({
      data: {
        tripId,
        createdByUserId: userId,
        label,
        snapshot: normalized,
      },
    });
  });

  return getTripLiveSnapshotState(userId, tripId);
}

export async function revertTripLiveSnapshot(userId: string, tripId: string, revisionId: string): Promise<TripLiveSnapshotStateDto> {
  const access = await getTripAccessContext(userId, tripId);
  if (!access.isOwner) {
    throw new HttpError(403, "Only the planner owner can revert the live snapshot.");
  }

  const revision = await db.tripLiveSnapshotRevision.findFirst({
    where: { id: revisionId, tripId },
    select: {
      snapshot: true,
      createdAt: true,
    },
  });

  if (!revision) {
    throw new HttpError(404, "Snapshot revision not found.");
  }

  const snapshot = normalizeTripLiveSnapshot(revision.snapshot);
  if (!snapshot) {
    throw new HttpError(400, "Snapshot revision is invalid.");
  }

  const stamp = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(revision.createdAt);

  return applyTripLiveSnapshot(userId, tripId, snapshot, `Reverted to ${stamp}`);
}
