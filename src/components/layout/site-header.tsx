import Image from "next/image";
import Link from "next/link";
import { CircleHelp, Sparkles } from "lucide-react";

import { isAdminEmail } from "@/lib/admin";
import { getUserBillingState } from "@/lib/billing";
import { getCurrentUserState } from "@/lib/auth/guards";
import { getNotificationPreview } from "@/server/services/notification-service";

import { PlanBadge } from "@/components/billing/plan-badge";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NotificationCenterButton } from "@/components/notifications/notification-center-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonStyles } from "@/components/ui/button";

const marketingLinks = [
  { href: "/#benefits", label: "Why Parqara" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#start", label: "Get started" },
];

type HeaderLink = {
  href: string;
  label: string;
};

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function SiteHeader() {
  const user = await getCurrentUserState();
  const billing = user ? getUserBillingState(user) : null;
  const adminUser = user ? isAdminEmail(user.email) : false;
  const notificationPreview = user ? await getNotificationPreview(user.id) : null;
  const displayName = user?.firstName ?? user?.name ?? user?.email ?? "Parqara";
  const initials = getInitials(displayName || "P");
  const navigationLinks: HeaderLink[] = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/notifications", label: "Inbox" },
        ...(adminUser ? [{ href: "/admin", label: "Admin" }] : []),
        { href: "/profile", label: "Profile" },
      ]
    : marketingLinks;

  return (
    <header className="sticky top-0 z-50 px-4 pt-0 sm:px-8 sm:pt-0 lg:px-10">
      <div className="mx-auto max-w-[88rem]">
        <div className="relative overflow-hidden rounded-[22px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(249,252,255,0.9)_100%)] shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur-2xl">
          <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.5),transparent)]" />

          <div
            className={`grid items-center gap-3 px-3 ${user ? "grid-cols-[auto,1fr,auto] py-0.5 sm:px-4 sm:py-1" : "grid-cols-[auto,1fr] py-0 sm:px-5 sm:py-0"}`}
          >
            <div className="min-w-0">
              {user ? (
                <Link href="/" aria-label="Parqara home" className="flex items-center">
                  <div className="h-[56px] w-[138px] overflow-hidden sm:h-[60px] sm:w-[148px]">
                    <Image
                      src="/brand/parqara-logo.png"
                      alt="Parqara"
                      width={2752}
                      height={1536}
                      priority
                      className="h-[108px] w-auto max-w-none -translate-x-[12px] -translate-y-[16px]"
                    />
                  </div>
                </Link>
              ) : (
                <Link href="/" aria-label="Parqara home" className="flex items-center">
                  <div className="h-[84px] w-[196px] overflow-hidden sm:h-[92px] sm:w-[212px]">
                    <Image
                      src="/brand/parqara-logo.png"
                      alt="Parqara"
                      width={2752}
                      height={1536}
                      priority
                      className="h-[156px] w-auto max-w-none -translate-x-[18px] -translate-y-[22px]"
                    />
                  </div>
                </Link>
              )}
            </div>

            <nav className={`hidden xl:flex ${user ? "items-center justify-center" : "items-center justify-end gap-4"}`}>
              <div
                className={
                  user
                    ? "flex items-center gap-1.5 rounded-full border border-white/85 bg-white/84 px-2 py-1 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                    : "flex items-center gap-4"
                }
              >
                {navigationLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[15px] font-semibold text-slate-600 transition duration-200 hover:bg-white hover:text-slate-950"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className={`flex items-center gap-2 ${user ? "shrink-0 justify-self-end" : "justify-self-end"}`}>
              {user && billing ? (
                <>
                  <Link
                    href="/help"
                    aria-label="Help and FAQ"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/88 text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:text-slate-950"
                  >
                    <CircleHelp className="h-4.5 w-4.5" />
                  </Link>
                  {notificationPreview ? <NotificationCenterButton initialCenter={notificationPreview} /> : null}
                  <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/88 pl-1.5 pr-2 py-1 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                    <Avatar className="h-8.5 w-8.5">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden min-w-0 md:block">
                      <p className="truncate text-sm font-semibold text-slate-950">{displayName}</p>
                      <div className="mt-0.5 flex items-center">
                        <PlanBadge tier={billing.currentTier} className="px-2.5 py-0.5 text-[10px]" />
                      </div>
                    </div>
                    <SignOutButton />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/help"
                    aria-label="Help and FAQ"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/88 text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:text-slate-950"
                  >
                    <CircleHelp className="h-4.5 w-4.5" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center justify-center rounded-full px-5 text-[15px] font-semibold text-slate-600 transition duration-200 hover:bg-slate-950/[0.04] hover:text-slate-950"
                  >
                    Log in
                  </Link>
                  <Link href="/signup" className={buttonStyles({ variant: "primary", size: "default" })}>
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200/70 px-3 py-0.5 xl:hidden">
            <nav className="flex gap-2 overflow-x-auto px-1">
              {navigationLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="shrink-0 rounded-full border border-white/90 bg-white/84 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition duration-200 hover:border-slate-200 hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
