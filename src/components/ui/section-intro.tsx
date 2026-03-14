import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionIntro({
  eyebrow,
  title,
  description,
  align = "left",
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-3",
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl",
        className
      )}
    >
      <p className="glass-chip inline-flex text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted-strong)]">
        {eyebrow}
      </p>
      <div
        className={cn(
          "space-y-3",
          actions ? "lg:flex lg:items-end lg:justify-between lg:gap-6 lg:space-y-0" : undefined
        )}
      >
        <div className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-4xl sm:leading-[0.96]">
            {title}
          </h2>
          {description ? <p className="text-sm leading-7 text-[var(--muted)] sm:text-base">{description}</p> : null}
        </div>
        {actions ? (
          <div className={cn("flex shrink-0 flex-wrap gap-3", align === "center" ? "justify-center" : undefined)}>
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
