import { NextResponse } from "next/server";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { getAppOrigin } from "@/lib/auth/google";
import { tripCollaboratorInviteSchema } from "@/lib/validation/trip-collaborator";
import { addUserPersonByEmail, getProfilePeopleState } from "@/server/services/user-service";

export async function GET() {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(await getProfilePeopleState(user.id));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = tripCollaboratorInviteSchema.parse(await request.json());
    return NextResponse.json(await addUserPersonByEmail(user.id, body.email, getAppOrigin(request)), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
