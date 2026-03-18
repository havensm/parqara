"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { TripWorkspaceTab } from "@/lib/trip-workspace";

import { BottomTabBar } from "@/components/app/bottom-tab-bar";

export function AppFrame({
  children,
  adminEnabled = false,
  currentTier,
  plannerTabs = [],
  className,
}: {
  children: ReactNode;
  adminEnabled?: boolean;
  currentTier?: "FREE" | "PLUS" | "PRO";
  plannerTabs?: Array<TripWorkspaceTab & { isActive?: boolean }>;
  className?: string;
}) {
  void adminEnabled;
  void currentTier;
  void plannerTabs;

  return (
    <div data-testid="app-frame" className={cn("relative overflow-x-hidden pb-28 xl:pb-0", className)}>
      <div className="relative min-w-0 h-full">{children}</div>
      <BottomTabBar />
    </div>
  );
}
