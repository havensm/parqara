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
  icon,
  visual,
  highlights = [],
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: ReactNode;
  visual?: ReactNode;
  highlights?: Array<{
    icon?: ReactNode;
    label: string;
  }>;
}) {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[36px] border border-white/80 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(20,184,166,0.14),transparent_24%),linear-gradient(145deg,rgba(255,255,255,0.95),rgba(243,249,253,0.96))] px-6 py-7 shadow-[0_26px_80px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              {icon ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/70 bg-white/80 text-teal-700 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                  {icon}
                </div>
              ) : null}
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">{eyebrow}</p>
            </div>

            <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>

            {highlights.length ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {highlights.map((item) => (
                  <div
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/82 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
                  >
                    {item.icon ? <span className="text-teal-700">{item.icon}</span> : null}
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {actionHref && actionLabel ? (
              <div className="mt-7">
                <Link href={actionHref} className={buttonStyles({ variant: "primary", size: "lg" })}>
                  {actionLabel}
                </Link>
              </div>
            ) : null}
          </div>

          {visual ? (
            <div className="rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(239,247,252,0.92))] p-4 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:p-5">
              {visual}
            </div>
          ) : (
            <div className="hidden xl:block" />
          )}
        </div>
      </section>

      {children}
    </div>
  );
}

