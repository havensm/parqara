import Image from "next/image";
import Link from "next/link";
import { CircleHelp, Compass, Sparkles } from "lucide-react";

import { isAdminEmail } from "@/lib/admin";
import { getCurrentUserStateIfAvailable } from "@/lib/auth/guards";
import { getUserBillingState } from "@/lib/billing";
import { cn } from "@/lib/utils";
import { getNotificationPreview } from "@/server/services/notification-service";

import { PlanBadge } from "@/components/billing/plan-badge";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NotificationCenterButton } from "@/components/notifications/notification-center-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonStyles } from "@/components/ui/button";

const marketingLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#planner-examples", label: "Planner examples" },
  { href: "/pricing", label: "Pricing" },
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

function HeaderLogo({ authenticated }: { authenticated: boolean }) {
  return (
    <Link href="/" aria-label="Parqara home" className="inline-flex items-center rounded-[24px] px-1 py-1 sm:px-1.5 sm:py-1.5">
      <Image
        src="/brand/parqara-logo-wordmark.png"
        alt="Parqara"
        width={1137}
        height={1012}
        priority
        className={cn(
          "w-auto object-contain drop-shadow-[0_10px_22px_rgba(12,20,37,0.08)]",
          authenticated ? "h-[58px] sm:h-[66px]" : "h-[66px] sm:h-[76px]"
        )}
      />
    </Link>
  );
}

export async function SiteHeader() {
  const user = await getCurrentUserStateIfAvailable();
  const billing = user ? getUserBillingState(user) : null;
  const adminUser = user ? isAdminEmail(user.email) : false;
  const notificationPreview = user ? await getNotificationPreview(user.id) : null;
  const displayName = user?.firstName ?? user?.name ?? user?.email ?? "Parqara";
  const initials = getInitials(displayName || "P");
  const navigationLinks: HeaderLink[] = user
    ? [
        { href: "/app", label: "Home" },
        { href: "/dashboard", label: "Planners" },
        { href: "/calendar", label: "Calendar" },
        { href: "/billing", label: "Billing" },
        ...(adminUser ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : marketingLinks;

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 sm:px-8 sm:pt-4 lg:px-10">
      <div className="mx-auto max-w-[94rem]">
        <div className="surface-shell glow-line relative overflow-hidden rounded-[28px] px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(99,167,255,0.16),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(28,198,170,0.12),transparent_22%),radial-gradient(circle_at_64%_100%,rgba(255,141,107,0.12),transparent_18%)]" />
          <div className="relative flex items-center gap-3">
            <div className="shrink-0 pr-1 sm:pr-2">
              <HeaderLogo authenticated={Boolean(user)} />
            </div>

            {!user ? (
              <>
                <nav className="hidden flex-1 items-center justify-center gap-2 xl:flex">
                  {navigationLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-white/70 hover:text-[var(--foreground)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                  <Link
                    href="/help"
                    aria-label="Help and FAQ"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/74 text-[var(--muted)] shadow-[0_10px_26px_rgba(12,20,37,0.08)] transition hover:text-[var(--foreground)]"
                  >
                    <CircleHelp className="h-4.5 w-4.5" />
                  </Link>
                  <Link href="/login" className="hidden rounded-full px-5 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-white/72 hover:text-[var(--foreground)] sm:inline-flex">
                    Log in
                  </Link>
                  <Link href="/signup" className={buttonStyles({ variant: "primary", size: "default" })}>
                    <Sparkles className="h-4 w-4" />
                    Start planning
                  </Link>
                </div>
              </>
            ) : billing ? (
              <>
                <div className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/74 px-4 py-2 shadow-[0_12px_30px_rgba(12,20,37,0.08)] lg:flex">
                  <Compass className="h-4 w-4 text-[var(--teal-700)]" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Workspace</p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Mara-guided planning</p>
                  </div>
                </div>

                <nav className="hidden flex-1 items-center justify-center gap-2 xl:flex">
                  {navigationLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-white/72 hover:text-[var(--foreground)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                  <Link
                    href="/help"
                    aria-label="Help and FAQ"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/74 text-[var(--muted)] shadow-[0_10px_26px_rgba(12,20,37,0.08)] transition hover:text-[var(--foreground)]"
                  >
                    <CircleHelp className="h-4.5 w-4.5" />
                  </Link>
                  {notificationPreview ? <NotificationCenterButton initialCenter={notificationPreview} /> : null}
                  <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/78 py-1 pl-1.5 pr-2.5 shadow-[0_14px_34px_rgba(12,20,37,0.08)]">
                    <Link
                      href="/profile"
                      aria-label="Open profile"
                      className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-1.5 transition hover:bg-white/92"
                    >
                      <Avatar className="h-10 w-10">
                        {user.profileImageDataUrl ? <AvatarImage src={user.profileImageDataUrl} alt={`${displayName} profile photo`} /> : null}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="hidden min-w-0 md:block">
                        <p className="max-w-[10rem] truncate text-sm font-semibold text-[var(--foreground)]">{displayName}</p>
                        <PlanBadge tier={billing.currentTier} className="mt-1 px-2.5 py-0.5 text-[10px]" />
                      </div>
                    </Link>
                    <SignOutButton />
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className={cn("relative mt-3 xl:hidden", user ? "block" : "block")}>
            <nav className="flex gap-2 overflow-x-auto pb-1">
              {navigationLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="glass-chip shrink-0 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]"
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

