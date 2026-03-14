"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export function Dialog({
  open,
  title,
  description,
  onClose,
  children,
  className,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="fixed inset-0 z-[90] bg-slate-950/38 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[91] flex items-center justify-center p-4 sm:p-6"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="dialog-title"
              className={cn(
                "max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(244,249,255,0.96))] shadow-[0_34px_96px_rgba(15,23,42,0.22)]",
                className
              )}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-5 sm:px-6">
                <div className="min-w-0">
                  <h2 id="dialog-title" className="text-xl font-semibold text-[var(--foreground)]">
                    {title}
                  </h2>
                  {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 rounded-full p-0">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close dialog</span>
                </Button>
              </div>
              <div className="max-h-[calc(90vh-5.5rem)] overflow-y-auto px-5 py-5 soft-scrollbar sm:px-6 sm:py-6">{children}</div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
