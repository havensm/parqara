import Link from "next/link";

import { BrandLogo } from "@/components/layout/brand-logo";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="px-4 pb-2 sm:px-8 sm:pb-3 lg:px-10">
      <div className="mx-auto flex max-w-[88rem] flex-col gap-2 rounded-[22px] border border-white/80 bg-white/82 px-4 py-2 shadow-[0_14px_32px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:px-5 sm:py-2.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-sm">
          <BrandLogo href="/" size="compact" imageClassName="h-16 w-auto sm:h-20" />
        </div>

        <div className="flex flex-col gap-1.5 lg:items-end">
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-slate-600">
            {footerLinks.map((item) => (
              <Link key={item.label} href={item.href} className="transition hover:text-slate-950">
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-slate-500 sm:text-sm">© {year} Parqara. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
