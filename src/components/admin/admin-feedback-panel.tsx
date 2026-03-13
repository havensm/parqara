"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { CheckCheck, ImageIcon, MessageSquareMore, Route } from "lucide-react";
import { FeedbackStatus } from "@prisma/client/index";

import type { AdminFeedbackSnapshot } from "@/server/services/feedback-service";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function formatDateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getFeedbackVariant(status: FeedbackStatus): "warning" | "success" {
  return status === FeedbackStatus.NEW ? "warning" : "success";
}

export function AdminFeedbackPanel({ feedback }: { feedback: AdminFeedbackSnapshot }) {
  const [items, setItems] = useState(feedback.items);
  const [isPending, startTransition] = useTransition();

  function markReviewed(feedbackId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/admin/feedback/${feedbackId}/review`, {
        method: "POST",
      });

      if (!response.ok) {
        return;
      }

      setItems((current) => current.map((item) => (item.id === feedbackId ? { ...item, status: FeedbackStatus.REVIEWED } : item)));
    });
  }

  const newCount = items.filter((item) => item.status === FeedbackStatus.NEW).length;
  const reviewedCount = items.length - newCount;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <FeedbackMetricCard label="Total" value={String(feedback.total)} helper="All submitted feedback" />
        <FeedbackMetricCard label="New" value={String(newCount)} helper="Still unreviewed" />
        <FeedbackMetricCard label="Reviewed" value={String(reviewedCount)} helper="Marked as handled" />
      </section>

      <section className="space-y-4">
        {items.length ? (
          items.map((item) => (
            <Card key={item.id} className="p-6 sm:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-slate-950">{item.user.name}</p>
                    <Badge variant={getFeedbackVariant(item.status)}>{item.status === FeedbackStatus.NEW ? "New" : "Reviewed"}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{item.user.email}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{formatDateTimeLabel(item.createdAt)}</span>
                    {item.pagePath ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Route className="h-3.5 w-3.5" />
                        {item.pagePath}
                      </span>
                    ) : null}
                    {item.screenshots.length ? (
                      <span className="inline-flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5" />
                        {item.screenshots.length} screenshot{item.screenshots.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                </div>

                {item.status === FeedbackStatus.NEW ? (
                  <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={() => markReviewed(item.id)}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark reviewed
                  </Button>
                ) : null}
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-sm leading-7 text-slate-700 whitespace-pre-wrap">{item.message}</p>
              </div>

              {item.screenshots.length ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {item.screenshots.map((screenshot) => (
                    <a
                      key={`${item.id}-${screenshot.name}`}
                      href={screenshot.dataUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-[22px] border border-slate-200 bg-white transition hover:border-slate-300"
                    >
                      <Image src={screenshot.dataUrl} alt={screenshot.name} width={1200} height={800} unoptimized className="h-44 w-full object-cover" />
                      <div className="px-4 py-3 text-xs font-medium text-slate-500">{screenshot.name}</div>
                    </a>
                  ))}
                </div>
              ) : null}
            </Card>
          ))
        ) : (
          <Card className="p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-slate-100 text-slate-500">
                <MessageSquareMore className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Feedback</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-950">No feedback yet</h3>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              Once users submit product notes or screenshots from the help page, they will appear here.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}

function FeedbackMetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </Card>
  );
}
