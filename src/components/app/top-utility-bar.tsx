import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { buttonStyles } from "@/components/ui/button";

export function TopUtilityBar({
  eyebrow,
  title,
  description,
  icon,
  highlights = [],
  actionHref,
  actionLabel,
  secondaryActionHref,
  secondaryActionLabel,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  highlights?: Array<{ icon?: ReactNode; label: string }>;
  actionHref?: string;
  actionLabel?: string;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
}) {
  const highlightText = highlights.map((item) => item.label).join(" · ");

  return (
    <section
      data-testid="top-utility-bar"
      className="overflow-hidden rounded-[34px] border border-white/72 bg-[linear-gradient(135deg,rgba(255,250,243,0.96),rgba(247,251,255,0.96))] px-5 py-5 shadow-[0_18px_42px_rgba(12,20,37,0.08)] sm:px-6 sm:py-6"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 max-w-4xl">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
            {icon ? <span className="text-[var(--teal-700)]">{icon}</span> : null}
            <span>{eyebrow}</span>
          </div>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-[2.45rem] sm:leading-[0.98]">
            {title}
          </h1>
          {description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">{description}</p> : null}
          {highlightText ? <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">{highlightText}</p> : null}
        </div>

        {(actionHref && actionLabel) || (secondaryActionHref && secondaryActionLabel) ? (
          <div className="flex flex-wrap gap-3 xl:justify-end">
            {secondaryActionHref && secondaryActionLabel ? (
              <Link href={secondaryActionHref} className={buttonStyles({ variant: "secondary", size: "default" })}>
                {secondaryActionLabel}
              </Link>
            ) : null}
            {actionHref && actionLabel ? (
              <Link href={actionHref} className={cn(buttonStyles({ variant: "primary", size: "default" }), "whitespace-nowrap")}>
                {actionLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
