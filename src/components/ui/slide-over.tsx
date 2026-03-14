"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SlideOver({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
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
            aria-label="Close panel"
            className="fixed inset-0 z-[90] bg-slate-950/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[91] w-full max-w-xl border-l border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,249,255,0.96))] px-5 pb-6 pt-5 shadow-[-24px_0_60px_rgba(15,23,42,0.16)] sm:px-6"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 rounded-full p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 h-[calc(100%-3.5rem)] overflow-y-auto soft-scrollbar">{children}</div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
