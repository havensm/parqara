import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { applyTripLiveSnapshot, getTripLiveSnapshotState } from "@/server/services/trip-live-snapshot-service";

const tripLiveSnapshotSchema = z.object({
  destination: z.string().trim().nullable(),
  duration: z.string().trim().nullable(),
  groupSummary: z.string().trim().nullable(),
  travelSummary: z.string().trim().nullable(),
  lodgingSummary: z.string().trim().nullable(),
  activities: z.array(z.string().trim()).max(6),
  supplies: z.array(z.string().trim()).max(8),
  latestTakeaway: z.string().trim().nullable(),
  mapQuery: z.string().trim().nullable(),
  status: z.enum(["DRAFT", "CONFIRMED"]),
});

const updateSnapshotSchema = z.object({
  snapshot: tripLiveSnapshotSchema,
  label: z.string().trim().max(120).optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId } = await params;
    const state = await getTripLiveSnapshotState(user.id, tripId);
    return NextResponse.json(state);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId } = await params;
    const body = updateSnapshotSchema.parse(await request.json());
    const state = await applyTripLiveSnapshot(user.id, tripId, body.snapshot, body.label);
    return NextResponse.json(state);
  } catch (error) {
    return apiError(error);
  }
}
