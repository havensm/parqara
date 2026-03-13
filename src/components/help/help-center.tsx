"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition, type ChangeEvent } from "react";
import { CheckCircle2, CircleHelp, ImagePlus, MessageSquarePlus, Search, X } from "lucide-react";

import { HELP_FAQ_ITEMS } from "@/lib/help-content";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type HelpCenterProps = {
  user: {
    email: string;
    name: string;
  } | null;
};

type FeedbackScreenshotInput = {
  name: string;
  dataUrl: string;
};

const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE = 1_500_000;

export function HelpCenter({ user }: HelpCenterProps) {
  const [query, setQuery] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [message, setMessage] = useState("");
  const [screenshots, setScreenshots] = useState<FeedbackScreenshotInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = HELP_FAQ_ITEMS.filter((item) => {
    if (!normalizedQuery) {
      return true;
    }

    const haystack = [item.question, item.answer, ...item.tags].join(" ").toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  async function handleScreenshotChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    if (screenshots.length + files.length > MAX_ATTACHMENTS) {
      setError(`Attach up to ${MAX_ATTACHMENTS} screenshots.`);
      return;
    }

    try {
      const nextScreenshots: FeedbackScreenshotInput[] = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image screenshots are supported.");
        }

        if (file.size > MAX_FILE_SIZE) {
          throw new Error("Keep each screenshot under 1.5 MB.");
        }

        nextScreenshots.push(await readFileAsDataUrl(file));
      }

      setScreenshots((current) => [...current, ...nextScreenshots]);
      setError(null);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not attach that screenshot.");
    }
  }

  function removeScreenshot(name: string) {
    setScreenshots((current) => current.filter((item) => item.name !== name));
  }

  function submitFeedback() {
    if (!user || isPending) {
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        setSuccess(null);

        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            pagePath: window.location.pathname,
            screenshots,
          }),
        });

        const result = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(result.error || "Could not send feedback right now.");
        }

        setMessage("");
        setScreenshots([]);
        setSuccess("Feedback sent. It is now visible in the admin dashboard.");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Could not send feedback right now.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),linear-gradient(180deg,rgba(248,252,255,0.98),rgba(255,255,255,0.98))] px-6 py-5 sm:px-7 sm:py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-teal-100 text-teal-700">
                <CircleHelp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">FAQ</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">Find quick answers</h2>
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Search the common questions first. Feedback is available below if you still need it.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 bg-white px-6 py-5 sm:px-7 sm:py-6">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400" htmlFor="help-search">
              Search FAQ
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="help-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Mara, sharing, plans, notifications..."
                className="h-12 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#1b6b63]/35 focus:bg-white"
              />
            </div>
            {user ? (
              <Button type="button" variant="secondary" size="default" onClick={() => setShowFeedback((current) => !current)}>
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                {showFeedback ? "Close feedback" : "Submit feedback"}
              </Button>
            ) : (
              <Link href="/login" className={buttonStyles({ variant: "secondary", size: "default" })}>
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                Sign in to send feedback
              </Link>
            )}
          </div>
        </div>
      </Card>

      {showFeedback ? (
        <Card className="p-6 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Feedback</p>
              <h3 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950">
                Tell us what needs work.
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Include what you were trying to do, what felt off, and a screenshot if it helps. Feedback goes straight to the admin dashboard.
              </p>
              <p className="mt-3 text-sm font-medium text-slate-500">Submitting as {user?.name ?? user?.email}</p>
            </div>
            <Badge variant="info">Internal feedback inbox</Badge>
          </div>

          <div className="mt-6 space-y-4">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Example: I was trying to add my sister to the planner, but I could not tell whether the invite sent or saved."
              className="min-h-[160px] w-full rounded-[26px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#1b6b63]/35 focus:bg-white"
            />

            <div className="flex flex-wrap items-center gap-3">
              <label className={cn(buttonStyles({ variant: "secondary", size: "default" }), "cursor-pointer")}>
                <ImagePlus className="mr-2 h-4 w-4" />
                Add screenshots
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleScreenshotChange} />
              </label>
              <span className="text-xs text-slate-500">Up to {MAX_ATTACHMENTS} screenshots, 1.5 MB each.</span>
            </div>

            {screenshots.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {screenshots.map((item) => (
                  <div key={item.name} className="rounded-[24px] border border-slate-200 bg-slate-50 p-3">
                    <Image src={item.dataUrl} alt={item.name} width={1200} height={800} unoptimized className="h-40 w-full rounded-[18px] object-cover" />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-xs font-medium text-slate-500">{item.name}</p>
                      <button type="button" onClick={() => removeScreenshot(item.name)} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700">
                        <X className="h-3.5 w-3.5" />
                        <span className="sr-only">Remove screenshot</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {error ? <p className="rounded-[22px] border border-[#efc1bc] bg-[#fff0ee] px-4 py-3 text-sm text-[#b14b41]">{error}</p> : null}
            {success ? (
              <div className="flex items-center gap-2 rounded-[22px] border border-[#c9ddcf] bg-[#eef7f1] px-4 py-3 text-sm text-[#2f6c50]">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button type="button" onClick={submitFeedback} disabled={isPending || !message.trim()}>
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                {isPending ? "Sending..." : "Send feedback"}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {filteredItems.length ? (
          filteredItems.map((item) => (
            <Card key={item.id} className="p-6 sm:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <h3 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
                    {item.question}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{item.answer}</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:max-w-[16rem] lg:justify-end">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">No matches</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">No FAQ entries match that search.</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">Try a broader term like Mara, sharing, plans, or inbox.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<FeedbackScreenshotInput>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        reject(new Error("Could not read that screenshot."));
        return;
      }

      resolve({
        name: file.name,
        dataUrl: result,
      });
    };
    reader.onerror = () => reject(new Error("Could not read that screenshot."));
    reader.readAsDataURL(file);
  });
}
