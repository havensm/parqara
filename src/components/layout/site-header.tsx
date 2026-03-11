import Link from "next/link";
import { LayoutDashboard, ReceiptText, Shield, Sparkles, UserRound } from "lucide-react";

import { getUserBillingState } from "@/lib/billing";
import { isAdminEmail } from "@/lib/admin";
import { getCurrentUserState } from "@/lib/auth/guards";

import { PlanBadge } from "@/components/billing/plan-badge";
import { BrandLogo } from "@/components/layout/brand-logo";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonStyles } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const marketingLinks = [
  { href: "/#benefits", label: "Why Parqara" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#start", label: "Get started" },
];

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
  const displayName = user?.firstName ?? user?.name ?? user?.email ?? "Parqara";
  const initials = getInitials(displayName || "P");

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 sm:px-8 sm:pt-4 lg:px-10">
      <div className="mx-auto max-w-[88rem]">
        <div className="relative overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.8)_100%)] px-4 py-3 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:px-5">
          <div className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.55),transparent)]" />

          <div className="flex items-center justify-between gap-4">
            <BrandLogo href="/" size="compact" priority subtitle="Park-day planner" className="min-w-0 text-slate-950" />

            {!user ? (
              <nav className="hidden items-center gap-1 rounded-full border border-white/90 bg-white/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] md:flex">
                {marketingLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition duration-200 hover:bg-slate-950/[0.04] hover:text-slate-950"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            ) : (
              <div className="hidden md:block" />
            )}

            <div className="flex items-center gap-2">
              {user && billing ? (
                <div className="flex items-center gap-2 rounded-full border border-white/90 bg-white/84 px-2 py-1 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden pr-1 sm:block">
                    <p className="text-sm font-semibold text-slate-950">{displayName}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <PlanBadge tier={billing.currentTier} />
                      <p className="text-xs text-slate-400">Planner ready</p>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="hidden h-6 sm:block" />
                  <Link href="/dashboard" className={buttonStyles({ variant: "ghost", size: "sm" })}>
                    <LayoutDashboard className="mr-1.5 h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link href="/billing" className={buttonStyles({ variant: "ghost", size: "sm" })}>
                    <ReceiptText className="mr-1.5 h-4 w-4" />
                    Billing
                  </Link>
                  {adminUser ? (
                    <Link href="/admin" className={buttonStyles({ variant: "ghost", size: "sm" })}>
                      <Shield className="mr-1.5 h-4 w-4" />
                      Admin
                    </Link>
                  ) : null}
                  <Link href="/profile" className={buttonStyles({ variant: "ghost", size: "sm" })}>
                    <UserRound className="mr-1.5 h-4 w-4" />
                    Profile
                  </Link>
                  <SignOutButton />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className={buttonStyles({ variant: "ghost", size: "sm" })}>
                    Log in
                  </Link>
                  <Link href="/signup" className={buttonStyles({ variant: "primary", size: "sm" })}>
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </div>

          {!user ? (
            <nav className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 md:hidden">
              {marketingLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="shrink-0 rounded-full border border-white/90 bg-white/84 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition duration-200 hover:border-slate-200 hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
    </header>
  );
}
