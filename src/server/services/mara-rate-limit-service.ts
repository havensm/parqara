import type { Prisma } from "@prisma/client/index";

import { MARA_STARTER_REPLY_LIMIT, getPlanByTier } from "@/lib/billing";
import type { SubscriptionTierValue } from "@/lib/contracts";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { buildMaraRateLimitMessage, getMaraRateLimitRules } from "@/lib/mara-rate-limit";

const MARA_REQUEST_RETENTION_MS = 2 * 24 * 60 * 60 * 1000;

type MaraRequestReservation = {
  maraPreviewRepliesUsed: number | null;
  hadStarterReplyReservation: boolean;
};

type RequestLogEntry = {
  id: string;
  createdAt: Date;
};

function buildScopedRequestWhere(userId: string, currentRequest: RequestLogEntry, windowMs: number): Prisma.MaraRequestLogWhereInput {
  const cutoff = new Date(currentRequest.createdAt.getTime() - windowMs);

  return {
    userId,
    AND: [
      {
        createdAt: {
          gte: cutoff,
        },
      },
      {
        OR: [
          {
            createdAt: {
              lt: currentRequest.createdAt,
            },
          },
          {
            createdAt: currentRequest.createdAt,
            id: {
              lte: currentRequest.id,
            },
          },
        ],
      },
    ],
  };
}

async function reserveMaraRateLimitSlot(userId: string, currentTier: SubscriptionTierValue) {
  const requestLog = await db.maraRequestLog.create({
    data: {
      userId,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  try {
    for (const rule of getMaraRateLimitRules(currentTier)) {
      const scopedWhere = buildScopedRequestWhere(userId, requestLog, rule.windowMs);
      const rank = await db.maraRequestLog.count({ where: scopedWhere });

      if (rank > rule.maxRequests) {
        const oldestBlockingRequest = await db.maraRequestLog.findFirst({
          where: scopedWhere,
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: {
            createdAt: true,
          },
        });

        const retryAfterSeconds = oldestBlockingRequest
          ? Math.max(1, Math.ceil((oldestBlockingRequest.createdAt.getTime() + rule.windowMs - Date.now()) / 1000))
          : Math.max(1, Math.ceil(rule.windowMs / 1000));

        throw new HttpError(429, buildMaraRateLimitMessage(rule, retryAfterSeconds), {
          details: {
            retryAfterSeconds,
          },
          headers: {
            "Retry-After": String(retryAfterSeconds),
          },
        });
      }
    }

    await db.maraRequestLog.deleteMany({
      where: {
        userId,
        createdAt: {
          lt: new Date(Date.now() - MARA_REQUEST_RETENTION_MS),
        },
      },
    });

    return requestLog;
  } catch (error) {
    await db.maraRequestLog.deleteMany({
      where: {
        id: requestLog.id,
      },
    });
    throw error;
  }
}

async function reserveMaraStarterReply(userId: string, currentTier: SubscriptionTierValue) {
  const updated = await db.user.updateMany({
    where: {
      id: userId,
      maraPreviewRepliesUsed: {
        lt: MARA_STARTER_REPLY_LIMIT,
      },
    },
    data: {
      maraPreviewRepliesUsed: {
        increment: 1,
      },
    },
  });

  const usage = await db.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      maraPreviewRepliesUsed: true,
    },
  });

  const usedReplies = usage?.maraPreviewRepliesUsed ?? MARA_STARTER_REPLY_LIMIT;

  if (!updated.count) {
    const replyLimit = MARA_STARTER_REPLY_LIMIT;
    const remainingStarterReplies = Math.max(0, replyLimit - usedReplies);
    throw new HttpError(
      402,
      `You have used the ${replyLimit} Mara starter replies included on ${getPlanByTier(currentTier).name}. Upgrade to Pro to keep planning with Mara.`,
      {
        details: {
          usedStarterReplies: usedReplies,
          remainingStarterReplies,
          starterReplyLimit: replyLimit,
        },
      }
    );
  }

  return usedReplies;
}

export async function reserveMaraUsage(params: {
  userId: string;
  currentTier: SubscriptionTierValue;
  hasFullAccess: boolean;
}): Promise<MaraRequestReservation> {
  const requestLog = await reserveMaraRateLimitSlot(params.userId, params.currentTier);

  try {
    const usedReplies = params.hasFullAccess ? null : await reserveMaraStarterReply(params.userId, params.currentTier);

    return {
      maraPreviewRepliesUsed: usedReplies,
      hadStarterReplyReservation: !params.hasFullAccess,
    };
  } catch (error) {
    await db.maraRequestLog.deleteMany({
      where: {
        id: requestLog.id,
      },
    });
    throw error;
  }
}

export async function rollbackMaraUsageReservation(params: { userId: string; hadStarterReplyReservation: boolean }) {
  if (!params.hadStarterReplyReservation) {
    return;
  }

  await db.user.update({
    where: {
      id: params.userId,
    },
    data: {
      maraPreviewRepliesUsed: {
        decrement: 1,
      },
    },
  });
}
