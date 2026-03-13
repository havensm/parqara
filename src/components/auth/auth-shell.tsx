import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CalendarRange, Route, Users } from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const authHighlights = [
  {
    icon: Users,
    title: "Shared trip context",
    detail: "Keep the group, goals, and must-dos in one place.",
  },
  {
    icon: Route,
    title: "Readable route plan",
    detail: "Turn the day into a sequence the whole group can follow.",
  },
  {
    icon: CalendarRange,
    title: "Faster next trip",
    detail: "Saved preferences make the next outing easier to start.",
  },
];

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  alternateHref: string;
  alternateLabel: string;
  variant?: "default" | "minimal";
};

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  alternateHref,
  alternateLabel,
  variant = "default",
}: AuthShellProps) {
  if (variant === "minimal") {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <Card className="overflow-hidden border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,251,253,0.92))] px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:px-8">
          <div className="space-y-4">
            <BrandLogo href="/" size="hero" subtitle="One place to shape the park day" imageClassName="h-24 w-auto sm:h-26" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">{eyebrow}</p>
              <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-[3rem] sm:leading-[0.98]">
                {title}
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-600">{description}</p>
            </div>
            <div>
              <Link href={alternateHref} className={`${buttonStyles({ variant: "secondary", size: "lg" })} gap-2`}>
                {alternateLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>

        <div>{children}</div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr] xl:items-start">
      <Card className="overflow-hidden border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,250,252,0.9))] p-0 shadow-[0_20px_54px_rgba(15,23,42,0.06)]">
        <div className="relative px-6 py-6 sm:px-8 sm:py-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.1),transparent_30%),radial-gradient(circle_at_84%_20%,rgba(15,118,110,0.12),transparent_26%)]" />
          <div className="relative space-y-5">
            <BrandLogo href="/" size="hero" subtitle="One place to shape the park day" imageClassName="h-24 w-auto sm:h-24" />

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">{eyebrow}</p>
              <h1 className="max-w-xl font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-[3.15rem] sm:leading-[0.96]">
                {title}
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-600">{description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {authHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-cyan-50 text-teal-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <Link href={alternateHref} className={`${buttonStyles({ variant: "secondary", size: "lg" })} gap-2`}>
                {alternateLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <div className="xl:sticky xl:top-20">{children}</div>
    </div>
  );
}
