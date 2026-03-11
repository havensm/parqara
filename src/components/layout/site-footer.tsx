import Link from "next/link";

import { BrandLogo } from "@/components/layout/brand-logo";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="px-4 pb-6 sm:px-8 sm:pb-8 lg:px-10">
      <div className="mx-auto flex max-w-[88rem] flex-col gap-6 rounded-[34px] border border-white/80 bg-white/82 px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:px-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-sm">
          <BrandLogo href="/" size="default" subtitle="Park-day planning and live routing for modern theme-park trips." />
        </div>

        <div className="flex flex-col gap-4 lg:items-end">
          <nav className="flex flex-wrap gap-6 text-sm font-medium text-slate-600">
            {footerLinks.map((item) => (
              <Link key={item.label} href={item.href} className="transition hover:text-slate-950">
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-slate-500">© {year} Parqara. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

