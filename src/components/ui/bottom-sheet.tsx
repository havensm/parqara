"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BottomSheet({
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
            aria-label="Close sheet"
            className="fixed inset-0 z-[90] bg-slate-950/36 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-[91] rounded-t-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,249,255,0.96))] px-4 pb-6 pt-4 shadow-[0_-24px_60px_rgba(15,23,42,0.18)] sm:px-6"
          >
            <div className="mx-auto max-w-3xl">
              <div className="mx-auto h-1.5 w-14 rounded-full bg-slate-200" />
              <div className="mt-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
                <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 rounded-full p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 max-h-[76vh] overflow-y-auto pb-1 soft-scrollbar">{children}</div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
