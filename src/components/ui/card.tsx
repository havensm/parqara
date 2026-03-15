import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "solid";
};

export function Card({ className, tone = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        tone === "solid"
          ? "relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,251,255,0.95))] shadow-[var(--shadow-soft)]"
          : "surface-panel panel-grid relative overflow-hidden rounded-[var(--radius-lg)]",
        className
      )}
      {...props}
    />
  );
}
