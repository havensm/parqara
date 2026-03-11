import type { ReactNode } from "react";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

export function AppShell({
  children,
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-[34px] border border-white/80 bg-white/86 px-6 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:px-8 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">{eyebrow}</p>
            <h1 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{description}</p>
          </div>
          {actionHref && actionLabel ? (
            <Link href={actionHref} className={buttonStyles({ variant: "primary", size: "lg" })}>
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </section>

      {children}
    </div>
  );
}
