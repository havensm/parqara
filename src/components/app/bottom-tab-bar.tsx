"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FolderKanban, LayoutDashboard, Sparkles, UserCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/app", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard", label: "Plans", icon: FolderKanban },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/notifications", label: "Inbox", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/trips/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <div data-testid="bottom-tab-bar" className="fixed inset-x-0 bottom-4 z-40 px-4 xl:hidden">
      <div className="surface-shell mx-auto flex max-w-xl items-center justify-between rounded-full px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-[11px] font-semibold transition",
                active
                  ? "bg-[linear-gradient(135deg,rgba(238,253,249,0.98),rgba(243,247,255,0.98))] text-[var(--foreground)] shadow-[0_14px_32px_rgba(12,20,37,0.08)]"
                  : "text-[var(--muted)]"
              )}
            >
              <Icon className={cn("h-4.5 w-4.5", active ? "text-[var(--teal-700)]" : "text-[var(--muted-strong)]")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
