import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const variants = {
  info: "border-[#b8ddd5] bg-[#edf7f4] text-[#1b6b63]",
  warning: "border-[#efd0a6] bg-[#fff4e5] text-[#9b6018]",
  critical: "border-[#efc1bc] bg-[#fff0ee] text-[#b14b41]",
  neutral: "border-[#d7ddd4] bg-[#f6f2ea] text-[#5d6d67]",
  success: "border-[#c9ddcf] bg-[#eef7f1] text-[#2f6c50]",
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
