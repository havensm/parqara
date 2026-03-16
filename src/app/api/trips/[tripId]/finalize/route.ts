import { z } from "zod";
import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { finalizeTripPlan } from "@/server/services/trip-finalization-service";

const finalizeTripSchema = z.object({
  sendReport: z.boolean().optional().default(false),
});

function getAppOrigin(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = finalizeTripSchema.parse(await request.json());
    const { tripId } = await params;
    const result = await finalizeTripPlan(user.id, tripId, {
      sendReport: body.sendReport,
      appOrigin: getAppOrigin(request),
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
