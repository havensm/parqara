import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { tripLogisticsCreateSchema } from "@/lib/validation/trip-logistics";
import { createTripLogisticsItems, getTripLogisticsBoard } from "@/server/services/trip-people-service";

export async function GET(_: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tripId } = await params;
    return NextResponse.json(await getTripLogisticsBoard(user.id, tripId));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = tripLogisticsCreateSchema.parse(await request.json());
    const { tripId } = await params;
    return NextResponse.json(await createTripLogisticsItems(user.id, tripId, body), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
