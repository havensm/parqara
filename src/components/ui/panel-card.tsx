"use client";

import type { HTMLMotionProps } from "motion/react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export function PanelCard({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "surface-shell panel-grid relative overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-panel)]",
        className
      )}
      {...props}
    />
  );
}
