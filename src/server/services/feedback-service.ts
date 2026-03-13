import { FeedbackStatus } from "@prisma/client/index";
import { z } from "zod";

import { db } from "@/lib/db";
import { HttpError } from "@/lib/http-error";

export const feedbackScreenshotSchema = z.object({
  name: z.string().trim().min(1).max(120),
  dataUrl: z.string().trim().startsWith("data:image/").max(2_500_000),
});

export const feedbackSubmissionSchema = z.object({
  message: z.string().trim().min(8).max(3_000),
  pagePath: z.string().trim().max(240).optional().nullable(),
  screenshots: z.array(feedbackScreenshotSchema).max(3).optional().default([]),
});

export type FeedbackScreenshot = z.infer<typeof feedbackScreenshotSchema>;
export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;

export type AdminFeedbackItem = {
  id: string;
  message: string;
  pagePath: string | null;
  status: FeedbackStatus;
  createdAt: string;
  user: {
    email: string;
    name: string;
  };
  screenshots: FeedbackScreenshot[];
};

export type AdminFeedbackSnapshot = {
  total: number;
  newCount: number;
  items: AdminFeedbackItem[];
};

function buildUserName(user: { firstName: string | null; lastName: string | null; name: string | null; email: string }) {
  const parts = [user.firstName, user.lastName].filter((value): value is string => Boolean(value && value.trim()));
  if (parts.length) {
    return parts.join(" ");
  }

  if (user.name?.trim()) {
    return user.name.trim();
  }

  return user.email;
}

function parseScreenshots(value: unknown): FeedbackScreenshot[] {
  const result = z.array(feedbackScreenshotSchema).safeParse(value ?? []);
  return result.success ? result.data : [];
}

export async function createFeedbackEntry(userId: string, input: unknown) {
  const submission = feedbackSubmissionSchema.parse(input);

  if (!submission.message.trim()) {
    throw new HttpError(400, "Feedback message is required.");
  }

  const feedback = await db.feedback.create({
    data: {
      userId,
      message: submission.message.trim(),
      pagePath: submission.pagePath?.trim() || null,
      screenshots: submission.screenshots.length ? submission.screenshots : undefined,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  return {
    id: feedback.id,
    createdAt: feedback.createdAt.toISOString(),
  };
}

export async function getAdminFeedbackSnapshot(): Promise<AdminFeedbackSnapshot> {
  const [total, newCount, items] = await Promise.all([
    db.feedback.count(),
    db.feedback.count({
      where: {
        status: FeedbackStatus.NEW,
      },
    }),
    db.feedback.findMany({
      take: 24,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        message: true,
        pagePath: true,
        status: true,
        createdAt: true,
        screenshots: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    total,
    newCount,
    items: items.map((item) => ({
      id: item.id,
      message: item.message,
      pagePath: item.pagePath,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      user: {
        email: item.user.email,
        name: buildUserName(item.user),
      },
      screenshots: parseScreenshots(item.screenshots),
    })),
  };
}

export async function markFeedbackReviewed(feedbackId: string) {
  const feedback = await db.feedback.update({
    where: {
      id: feedbackId,
    },
    data: {
      status: FeedbackStatus.REVIEWED,
    },
    select: {
      id: true,
      status: true,
    },
  });

  return feedback;
}
