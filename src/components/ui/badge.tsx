import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const variants = {
  info: "border-[rgba(28,198,170,0.2)] bg-[rgba(238,253,249,0.94)] text-[var(--teal-700)]",
  warning: "border-[rgba(244,182,73,0.22)] bg-[rgba(255,248,235,0.96)] text-[var(--amber-700)]",
  critical: "border-[rgba(213,107,98,0.22)] bg-[rgba(255,241,239,0.96)] text-[var(--danger-500)]",
  neutral: "border-[rgba(96,128,165,0.18)] bg-[rgba(246,249,255,0.92)] text-[var(--muted-strong)]",
  success: "border-[rgba(46,189,125,0.22)] bg-[rgba(239,252,244,0.96)] text-[var(--success-500)]",
};

export function Badge({
  className,
  children,
  variant = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
