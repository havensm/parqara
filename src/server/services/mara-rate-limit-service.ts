import type { Prisma } from "@prisma/client/index";

import type { SubscriptionTierValue } from "@/lib/contracts";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { buildMaraRateLimitMessage, getMaraRateLimitRules } from "@/lib/mara-rate-limit";

const MARA_REQUEST_RETENTION_MS = 2 * 24 * 60 * 60 * 1000;

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
  // We log first, then count inside each rolling window so burst traffic and retries are capped consistently.
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
  } catch (error) {
    await db.maraRequestLog.deleteMany({
      where: {
        id: requestLog.id,
      },
    });
    throw error;
  }
}

export async function reserveMaraUsage(params: {
  userId: string;
  currentTier: SubscriptionTierValue;
}) {
  await reserveMaraRateLimitSlot(params.userId, params.currentTier);
}
