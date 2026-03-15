import Link from "next/link";

import { BrandLogo } from "@/components/layout/brand-logo";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/pricing", label: "Pricing" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="pt-2 pb-3 sm:pb-4">
      <div className="surface-shell relative overflow-hidden rounded-[28px] px-5 py-5 sm:px-6 sm:py-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(99,167,255,0.08),transparent_24%),radial-gradient(circle_at_86%_22%,rgba(28,198,170,0.08),transparent_24%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-lg">
            <BrandLogo href="/" size="compact" imageClassName="h-16 w-auto sm:h-20" />
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-[var(--muted)]">
              {footerLinks.map((item) => (
                <Link key={item.label} href={item.href} className="transition hover:text-[var(--foreground)]">
                  {item.label}
                </Link>
              ))}
            </nav>
            <p className="text-sm text-[var(--muted)]">© {year} Parqara. Premium planning, without the chaos.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
