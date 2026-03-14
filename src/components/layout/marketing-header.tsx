import Link from "next/link";

import { BrandLogo } from "@/components/layout/brand-logo";
import { buttonStyles } from "@/components/ui/button";

const marketingLinks = [
  { href: "/#how-it-works", label: "Features" },
  { href: "/#use-cases", label: "Use cases" },
  { href: "/#pricing", label: "Pricing" },
] as const;

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 pb-3 sm:pb-4">
      <div className="surface-shell glow-line relative overflow-hidden rounded-[24px] px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(99,167,255,0.14),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(28,198,170,0.1),transparent_22%)]" />
        <div className="relative flex items-center gap-3">
          <BrandLogo href="/" size="compact" imageClassName="h-11 w-auto sm:h-12" />

          <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex">
            {marketingLinks.map((item) => (
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
            <Link href="/login" className={buttonStyles({ variant: "secondary", size: "sm" })}>
              Log in
            </Link>
            <Link href="/signup" className={buttonStyles({ variant: "primary", size: "sm" })}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
