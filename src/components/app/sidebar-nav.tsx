"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  MessageSquareText,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";

import type { TripWorkspaceTab } from "@/lib/trip-workspace";
import { cn } from "@/lib/utils";

import { BrandLogo } from "@/components/layout/brand-logo";

const navItems = [
  { href: "/dashboard", label: "Mara", icon: MessageSquareText },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/trips/");
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
  void plannerTabs;

  const pathname = usePathname();
  const items = adminEnabled ? [...navItems, { href: "/admin", label: "Admin", icon: ShieldCheck }] : navItems;

  return (
    <div
      data-testid="sidebar-nav"
      className="rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,250,255,0.92))] p-4 shadow-[0_20px_42px_rgba(12,20,37,0.08)]"
    >
      <Link
        href="/"
        aria-label="Go to the Parqara landing page"
        className="flex min-h-[7.75rem] items-center justify-center overflow-hidden rounded-[22px] border border-[var(--card-border)] bg-[linear-gradient(135deg,rgba(255,249,240,0.96),rgba(244,249,255,0.96))] px-4 py-4 transition hover:bg-white"
      >
        <BrandLogo href={undefined} size="compact" className="items-center" imageClassName="h-[4.8rem] w-auto scale-[1.08] sm:h-[5.2rem]" />
      </Link>

      <nav className="mt-4 space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[18px] px-3.5 py-3 text-sm font-semibold transition",
                active
                  ? "bg-[rgba(232,246,244,0.96)] text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:bg-white/78 hover:text-[var(--foreground)]"
              )}
            >
              <Icon className={cn("h-4.5 w-4.5", active ? "text-[var(--teal-700)]" : "text-[var(--muted-strong)]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {currentTier ? (
        <div className="mt-4 rounded-[18px] border border-[rgba(244,182,73,0.18)] bg-[linear-gradient(135deg,rgba(255,249,240,0.94),rgba(245,249,255,0.92))] px-3.5 py-3 text-xs leading-6 text-[var(--muted)]">
          <span className="font-semibold text-[var(--foreground)]">{currentTier}</span>
          <span> plan</span>
          <span className="mx-2 text-[var(--card-border-strong)]">·</span>
          <span>Billing lives in Profile.</span>
        </div>
      ) : null}
    </div>
  );
}
