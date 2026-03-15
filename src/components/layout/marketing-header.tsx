import Link from "next/link";

import { getCurrentUserStateIfAvailable } from "@/lib/auth/guards";

import { BrandLogo } from "@/components/layout/brand-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonStyles } from "@/components/ui/button";

function getInitials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "P"
  );
}

export async function MarketingHeader() {
  const user = await getCurrentUserStateIfAvailable();
  const displayName = user?.firstName ?? user?.name ?? user?.email ?? "Parqara";
  const initials = getInitials(displayName);

  return (
    <header className="sticky top-0 z-50 pb-3 sm:pb-4">
      <div className="surface-shell glow-line relative overflow-hidden rounded-[24px] px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(99,167,255,0.14),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(28,198,170,0.1),transparent_22%)]" />
        <div className="relative flex items-center justify-between gap-4">
          <BrandLogo href="/" size="default" imageClassName="h-16 w-auto sm:h-20" />

          {user ? (
            <div className="ml-auto flex items-center gap-3">
              <Link
                href="/profile"
                className="hidden items-center gap-3 rounded-[18px] border border-[var(--card-border)] bg-white/74 px-3 py-2.5 text-left shadow-[0_10px_22px_rgba(12,20,37,0.06)] transition hover:bg-white sm:flex"
              >
                <Avatar className="h-10 w-10 ring-2 ring-white/70">
                  {user.profileImageDataUrl ? <AvatarImage src={user.profileImageDataUrl} alt={`${displayName} profile photo`} /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{displayName}</p>
                  <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
                </div>
              </Link>
              <Link href="/dashboard" className={buttonStyles({ variant: "primary", size: "sm" })}>
                Go to Mara
              </Link>
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              <Link href="/login" className={buttonStyles({ variant: "secondary", size: "sm" })}>
                Log in
              </Link>
              <Link href="/signup" className={buttonStyles({ variant: "primary", size: "sm" })}>
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
