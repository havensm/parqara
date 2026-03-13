"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, PlayCircle, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type BaseTourStep = {
  targetId: string;
  title: string;
  description: string;
};

type ResolvedTourStep = BaseTourStep & {
  rect: { top: number; left: number; width: number; height: number };
};

const baseSteps: BaseTourStep[] = [
  {
    targetId: "planner-workspace",
    title: "Keep each adventure in its own planner",
    description: "Switch planners here and rename the active one fast.",
  },
  {
    targetId: "mara-concierge",
    title: "Use Mara to shape the trip faster",
    description: "Use Mara to turn a rough idea into a workable plan.",
  },
  {
    targetId: "planning-panel",
    title: "Set the trip basics once",
    description: "Set the date, group, pace, and must-dos here.",
  },
  {
    targetId: "build-plan-action",
    title: "Build the first itinerary when the basics look right",
    description: "Build the first route here, then refine it after.",
  },
];

function resolveStepRect(targetId: string) {
  const element = document.querySelector<HTMLElement>(`[data-tour-id="${targetId}"]`);
  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  const padding = 12;

  return {
    top: Math.max(12, rect.top - padding),
    left: Math.max(12, rect.left - padding),
    width: Math.min(window.innerWidth - 24, rect.width + padding * 2),
    height: Math.min(window.innerHeight - 24, rect.height + padding * 2),
  };
}

function scrollStepIntoView(targetId: string) {
  const element = document.querySelector<HTMLElement>(`[data-tour-id="${targetId}"]`);
  element?.scrollIntoView({ block: "center", behavior: "smooth" });
}

export function FirstTimePlannerTour({ enabled, preview = false }: { enabled: boolean; preview?: boolean }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<ResolvedTourStep[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsOpen(false);
      setSteps([]);
      setStepIndex(0);
      return;
    }

    const nextSteps = baseSteps
      .map((step) => {
        const rect = resolveStepRect(step.targetId);
        return rect ? { ...step, rect } : null;
      })
      .filter((step): step is ResolvedTourStep => Boolean(step));

    if (!nextSteps.length) {
      return;
    }

    setSteps(nextSteps);
    setStepIndex(0);
    setIsOpen(true);
  }, [enabled]);

  useEffect(() => {
    if (!isOpen || !steps.length) {
      return;
    }

    const syncActiveStep = () => {
      const current = steps[stepIndex];
      const rect = resolveStepRect(current.targetId);
      if (!rect) {
        return;
      }

      setSteps((existing) => existing.map((step, index) => (index === stepIndex ? { ...step, rect } : step)));
    };

    const current = steps[stepIndex];
    scrollStepIntoView(current.targetId);
    const timeout = window.setTimeout(syncActiveStep, 260);
    window.addEventListener("resize", syncActiveStep);
    window.addEventListener("scroll", syncActiveStep, true);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("resize", syncActiveStep);
      window.removeEventListener("scroll", syncActiveStep, true);
    };
  }, [isOpen, stepIndex, steps]);

  const currentStep = useMemo(() => steps[stepIndex] ?? null, [stepIndex, steps]);

  async function finishTour() {
    if (!preview) {
      try {
        setIsCompleting(true);
        await fetch("/api/first-time", {
          method: "POST",
        });
      } finally {
        setIsCompleting(false);
      }
    }

    setIsOpen(false);
  }

  if (!enabled || !isOpen || !currentStep) {
    return null;
  }

  const isLastStep = stepIndex === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[80]">
      <div
        className="pointer-events-none fixed rounded-[28px] border-2 border-white/95 shadow-[0_0_0_9999px_rgba(15,23,42,0.58),0_24px_90px_rgba(15,23,42,0.3)] transition-all duration-300"
        style={{
          top: currentStep.rect.top,
          left: currentStep.rect.left,
          width: currentStep.rect.width,
          height: currentStep.rect.height,
        }}
      />

      <div className="fixed inset-x-4 bottom-4 z-[81] sm:left-auto sm:right-6 sm:w-full sm:max-w-md">
        <div className="rounded-[30px] border border-white/80 bg-white px-5 py-5 shadow-[0_24px_90px_rgba(15,23,42,0.28)] sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">First look</p>
                {preview ? <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Preview</span> : null}
              </div>
              <h2 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold tracking-tight text-slate-950">
                {currentStep.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{currentStep.description}</p>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-950"
              onClick={() => void finishTour()}
              aria-label="Close walkthrough"
              disabled={isCompleting}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-500">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              <PlayCircle className="h-4 w-4 text-teal-700" />
              Step {stepIndex + 1} of {steps.length}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              <Sparkles className="h-4 w-4 text-teal-700" />
              {preview ? "Does not change your flag" : "Closes after this pass"}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => setStepIndex((current) => Math.max(0, current - 1))} disabled={stepIndex === 0 || isCompleting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" size="sm" onClick={() => void finishTour()} disabled={isCompleting}>
                {isCompleting ? "Closing..." : "Skip"}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (isLastStep) {
                    void finishTour();
                    return;
                  }

                  setStepIndex((current) => Math.min(steps.length - 1, current + 1));
                }}
                disabled={isCompleting}
              >
                {isLastStep ? (isCompleting ? "Finishing..." : "Finish") : "Next"}
                {!isLastStep ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





