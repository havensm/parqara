"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from "lucide-react";

import type { TripWorkspaceTab } from "@/lib/trip-workspace";
import { cn } from "@/lib/utils";

import { PlanBadge } from "@/components/billing/plan-badge";
import { BrandLogo } from "@/components/layout/brand-logo";
import { StatusChip } from "@/components/ui/status-chip";

const navItems = [
  { href: "/app", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard", label: "Planners", icon: FolderKanban },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/notifications", label: "Inbox", icon: Sparkles },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/trips/");
  }

  if (href === "/app") {
    return pathname === "/app";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  adminEnabled = false,
  currentTier,
  plannerTabs = [],
}: {
  adminEnabled?: boolean;
  currentTier?: "FREE" | "PLUS" | "PRO";
  plannerTabs?: Array<TripWorkspaceTab & { isActive?: boolean }>;
}) {
  const pathname = usePathname();
  const items = adminEnabled ? [...navItems, { href: "/admin", label: "Admin", icon: ShieldCheck }] : navItems;

  return (
    <div data-testid="sidebar-nav" className="space-y-3 xl:space-y-4">
      <div className="surface-shell relative overflow-hidden rounded-[34px] p-3.5 xl:p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(99,167,255,0.16),transparent_22%),radial-gradient(circle_at_82%_18%,rgba(28,198,170,0.14),transparent_22%)]" />
        <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,250,255,0.72))] p-4 shadow-[0_16px_34px_rgba(12,20,37,0.08)]">
          <Link
            href="/"
            aria-label="Go to the Parqara landing page"
            className="flex min-h-[8.5rem] items-center justify-center rounded-[22px] border border-[var(--card-border)] bg-white px-4 py-4 text-center transition hover:border-[rgba(28,198,170,0.18)] hover:bg-[rgba(255,255,255,0.98)] hover:shadow-[0_14px_28px_rgba(12,20,37,0.06)]"
          >
            <BrandLogo href={undefined} size="compact" className="items-center" imageClassName="h-20 w-auto scale-[1.16] sm:h-24" />
          </Link>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Navigation</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Trips, outings, and premium planning flows.</p>
            </div>
            {currentTier ? <PlanBadge tier={currentTier} /> : null}
          </div>

          <nav className="mt-4 space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "premium-card-tilt flex items-center gap-3 rounded-[24px] border px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "border-[rgba(28,198,170,0.2)] bg-[linear-gradient(135deg,rgba(238,253,249,0.96),rgba(243,247,255,0.94))] text-[var(--foreground)] shadow-[0_18px_40px_rgba(12,20,37,0.08)]"
                      : "border-transparent bg-white/60 text-[var(--muted)] hover:border-[var(--card-border)] hover:bg-white/84 hover:text-[var(--foreground)]"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-[18px]",
                      active
                        ? "bg-[rgba(28,198,170,0.12)] text-[var(--teal-700)]"
                        : "bg-[rgba(239,244,250,0.92)] text-[var(--muted-strong)]"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {plannerTabs.length ? (
        <div className="surface-shell relative overflow-hidden rounded-[30px] p-3.5 xl:p-4">
          <div className="relative rounded-[24px] border border-white/70 bg-white/74 p-4 shadow-[0_14px_30px_rgba(12,20,37,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Planner switcher</p>
                <p className="mt-1 text-sm text-[var(--muted)]">Jump between active workspaces.</p>
              </div>
              <StatusChip label={`${plannerTabs.length} open`} tone="sky" />
            </div>
            <div className="mt-4 space-y-2">
              {plannerTabs.slice(0, 6).map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[20px] border px-3 py-3 text-sm transition",
                    tab.isActive
                      ? "border-[rgba(28,198,170,0.2)] bg-[rgba(238,253,249,0.92)] text-[var(--foreground)]"
                      : "border-[var(--card-border)] bg-[rgba(248,251,255,0.82)] text-[var(--muted)] hover:border-[rgba(99,167,255,0.2)] hover:bg-white"
                  )}
                >
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      tab.status === "LIVE"
                        ? "bg-sky-500"
                        : tab.status === "PLANNED"
                          ? "bg-teal-500"
                          : tab.status === "DRAFT"
                            ? "bg-amber-500"
                            : "bg-slate-400"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[var(--foreground)]">{tab.label}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{tab.parkName}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


