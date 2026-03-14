import { z } from "zod";
import { NextResponse } from "next/server";

import { apiError, requireApiFeatureAccess, requireApiUser } from "@/app/api/_utils";
import { createPlannerTemplateFromTrip } from "@/server/services/trip-service";

const templateRequestSchema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    requireApiFeatureAccess(user, "plannerTemplates");

    const body = templateRequestSchema.parse(await request.json().catch(() => ({})));
    const { tripId } = await params;
    const template = await createPlannerTemplateFromTrip(user.id, tripId, body.name);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
