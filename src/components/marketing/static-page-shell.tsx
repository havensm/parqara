import Link from "next/link";
import type { ReactNode } from "react";

import { buttonStyles } from "@/components/ui/button";

type StaticPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function StaticPageShell({ eyebrow, title, description, children }: StaticPageShellProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16 sm:space-y-10 sm:pb-20">
      <section className="rounded-[36px] border border-white/80 bg-white/84 px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:px-8 sm:py-10 lg:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{eyebrow}</p>
        <h1 className="mt-4 font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className={buttonStyles({ variant: "primary", size: "lg" })}>
            Back to home
          </Link>
          <Link href="/signup" className={buttonStyles({ variant: "secondary", size: "lg" })}>
            Create account
          </Link>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/80 bg-white/80 px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:px-8">
        <div className="space-y-6 text-sm leading-7 text-slate-600 sm:text-base">{children}</div>
      </section>
    </div>
  );
}

