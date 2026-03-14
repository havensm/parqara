import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { generatedVisuals } from "@/lib/generated-assets";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VisualShowcase } from "@/components/ui/visual-showcase";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  eyebrow,
  visual,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  eyebrow?: string;
  visual?: ReactNode;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,0.96fr)_minmax(320px,1.04fr)]">
        <div className="px-8 py-8 sm:px-10 sm:py-10">
          {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">{eyebrow}</p> : null}
          <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">{title}</h2>
          <p className="mt-4 max-w-xl text-base leading-8 text-[var(--muted)]">{description}</p>
          <Link href={actionHref} className={buttonStyles({ variant: "primary", size: "lg" }) + " mt-8"}>
            {actionLabel}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
        <div className="border-t border-[var(--card-border)] bg-[var(--surface-muted)] p-4 lg:border-l lg:border-t-0">
          {visual ?? (
            <VisualShowcase
              src={generatedVisuals.planners.starter}
              alt="Parqara starter artwork"
              eyebrow="Start here"
              title="Your next plan can begin with one idea."
              description="Parqara turns that spark into a polished planner with Mara, richer structure, and cleaner follow-through."
              aspect="square"
            />
          )}
        </div>
      </div>
    </Card>
  );
}
