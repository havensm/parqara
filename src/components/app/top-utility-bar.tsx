import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { buttonStyles } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";

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
  return (
    <section data-testid="top-utility-bar" className="surface-shell overflow-hidden rounded-[38px] px-5 py-5 sm:px-6 sm:py-6 lg:px-7">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            {icon ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(238,253,249,0.92)] text-[var(--teal-700)] shadow-[0_14px_30px_rgba(12,20,37,0.08)]">
                {icon}
              </div>
            ) : null}
            <StatusChip label={eyebrow} tone="teal" />
          </div>
          <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-[2.75rem] sm:leading-[0.94]">
            {title}
          </h1>
          {description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-[15px]">{description}</p> : null}
          {highlights.length ? (
            <div className="mt-5 flex flex-wrap gap-2.5">
              {highlights.map((item) => (
                <div
                  key={item.label}
                  className="glass-chip inline-flex items-center gap-2 px-3.5 py-2 text-sm text-[var(--muted-strong)]"
                >
                  {item.icon ? <span className="text-[var(--teal-700)]">{item.icon}</span> : null}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ) : null}
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

