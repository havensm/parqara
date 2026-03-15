"use client";

import type { ReactNode } from "react";

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
    <div data-testid="app-frame" className="relative overflow-hidden pb-24 xl:pb-0">
      <div className="relative min-w-0">{children}</div>
      <BottomTabBar />
    </div>
  );
}

