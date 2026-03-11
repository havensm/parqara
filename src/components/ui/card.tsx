import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[30px] border border-[rgba(18,37,31,0.1)] bg-[rgba(255,253,249,0.92)] shadow-[0_24px_64px_rgba(24,41,36,0.06)] backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
