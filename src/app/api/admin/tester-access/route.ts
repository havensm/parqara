import { NextResponse } from "next/server";
import { z } from "zod";
import { SubscriptionTier } from "@prisma/client/index";

import { apiError, requireApiUser } from "@/app/api/_utils";
import { isAdminEmail } from "@/lib/admin";
import { adminSetSubscriptionTierByEmail } from "@/server/services/user-service";

const adminTesterAccessSchema = z.object({
  email: z.string().trim().email().max(320),
  subscriptionTier: z.nativeEnum(SubscriptionTier),
});

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = adminTesterAccessSchema.parse(await request.json());

    try {
      const result = await adminSetSubscriptionTierByEmail(body);
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "User not found.") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error instanceof Error && error.message === "Email is required.") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      throw error;
    }
  } catch (error) {
    return apiError(error);
  }
}
