"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, MessageSquareText, UserCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
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

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <div data-testid="bottom-tab-bar" className="fixed inset-x-0 bottom-4 z-40 px-4 xl:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between rounded-[24px] border border-white/72 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.94))] px-2 py-2 shadow-[0_20px_44px_rgba(12,20,37,0.16)] backdrop-blur-md">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-semibold transition",
                active
                  ? "bg-[linear-gradient(135deg,rgba(226,250,243,0.96),rgba(239,246,255,0.98))] text-[var(--foreground)] shadow-[0_10px_20px_rgba(12,20,37,0.08)]"
                  : "text-[var(--muted)] hover:bg-white/78"
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
