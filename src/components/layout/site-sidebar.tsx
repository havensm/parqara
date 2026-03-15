import Image from "next/image";
import Link from "next/link";
import { CircleHelp, Mail, Sparkles } from "lucide-react";

import { isAdminEmail } from "@/lib/admin";
import { getCurrentUserStateIfAvailable } from "@/lib/auth/guards";
import { getUserBillingState } from "@/lib/billing";
import { generatedVisuals } from "@/lib/generated-assets";

import { SidebarNav } from "@/components/app/sidebar-nav";
import { BrandLogo } from "@/components/layout/brand-logo";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonStyles } from "@/components/ui/button";

const marketingLinks = [
  { href: "/", label: "Home" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
] as const;

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function SiteSidebar() {
  const user = await getCurrentUserStateIfAvailable();

  if (!user) {
    return <MarketingSidebar />;
  }

  const billing = getUserBillingState(user);
  const adminEnabled = isAdminEmail(user.email);
  const displayName = user.firstName ?? user.name ?? user.email ?? "Parqara";
  const initials = getInitials(displayName || "P");

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-white/72 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,250,255,0.94))] p-4 shadow-[0_18px_36px_rgba(12,20,37,0.08)]">
        <Link href="/profile" className="flex min-w-0 items-center gap-3 rounded-[18px] p-1 transition hover:bg-white/72">
          <Avatar className="h-12 w-12 ring-2 ring-white/70 shadow-[0_10px_22px_rgba(12,20,37,0.10)]">
            {user.profileImageDataUrl ? <AvatarImage src={user.profileImageDataUrl} alt={`${displayName} profile photo`} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">{displayName}</p>
            <p className="mt-1 truncate text-xs text-[var(--muted)]">{user.email}</p>
          </div>
        </Link>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] border border-[var(--card-border)] bg-[var(--surface-muted)] px-3.5 py-3 text-sm">
          <div>
            <p className="font-semibold text-[var(--foreground)]">{billing.currentPlan.name}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Account and billing live in Profile.</p>
          </div>
          <Link href="/profile" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Account
          </Link>
        </div>

        <div className="mt-4 flex justify-end">
          <SignOutButton />
        </div>
      </div>

      <SidebarNav adminEnabled={adminEnabled} currentTier={billing.currentTier} />
    </div>
  );
}

function MarketingSidebar() {
  return (
    <div className="space-y-3 xl:space-y-4">
      <div className="surface-shell relative overflow-hidden rounded-[34px] p-3.5 xl:p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(99,167,255,0.16),transparent_22%),radial-gradient(circle_at_82%_18%,rgba(28,198,170,0.14),transparent_22%)]" />
        <div className="relative rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(247,250,255,0.74))] p-4 shadow-[0_16px_34px_rgba(12,20,37,0.08)]">
          <BrandLogo href="/" size="compact" imageClassName="h-12 w-auto sm:h-14 xl:h-16" />
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Mara-led planning for trips, weekends, outings, date nights, and family adventures.
          </p>

          <div className="relative mt-4 h-32 overflow-hidden rounded-[22px] border border-white/50 xl:h-36">
            <Image
              src={generatedVisuals.homepage.story}
              alt="Parqara planning inspiration"
              fill
              sizes="320px"
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,22,38,0.08)_0%,rgba(10,22,38,0.68)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Navigate</p>
              <p className="mt-1 text-lg font-semibold">Plan what matters.</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Explore</p>
            <nav className="mt-3 space-y-2">
              {marketingLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="premium-card-tilt flex items-center rounded-[22px] border border-transparent bg-white/60 px-4 py-3 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--card-border)] hover:bg-white/84 hover:text-[var(--foreground)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Link href="/signup" className={buttonStyles({ variant: "primary", size: "default" }) + " w-full justify-center"}>
              <Sparkles className="h-4 w-4" />
              Start planning
            </Link>
            <Link href="/login" className={buttonStyles({ variant: "secondary", size: "default" }) + " w-full justify-center"}>
              Log in
            </Link>
          </div>
        </div>
      </div>

      <div className="surface-shell relative overflow-hidden rounded-[30px] p-3.5 xl:p-4">
        <div className="relative rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-[0_14px_30px_rgba(12,20,37,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Need a hand?</p>
          <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">Support and access</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Browse the product story, get help, or jump straight into your first planner.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/help" className={buttonStyles({ variant: "secondary", size: "sm" }) + " w-full justify-center"}>
              <CircleHelp className="h-4 w-4" />
              Help and FAQ
            </Link>
            <Link href="/contact" className={buttonStyles({ variant: "ghost", size: "sm" }) + " w-full justify-center border border-[var(--card-border)] bg-white/72"}>
              <Mail className="h-4 w-4" />
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
