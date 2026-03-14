"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

import type { TripWorkspaceTab } from "@/lib/trip-workspace";

import { BottomTabBar } from "@/components/app/bottom-tab-bar";

export function AppFrame({
  children,
  adminEnabled = false,
  currentTier,
  plannerTabs = [],
}: {
  children: ReactNode;
  adminEnabled?: boolean;
  currentTier?: "FREE" | "PLUS" | "PRO";
  plannerTabs?: Array<TripWorkspaceTab & { isActive?: boolean }>;
}) {
  void adminEnabled;
  void currentTier;
  void plannerTabs;

  return (
    <div data-testid="app-frame" className="relative pb-28 xl:pb-0">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="min-w-0"
      >
        {children}
      </motion.div>
      <BottomTabBar />
    </div>
  );
}
