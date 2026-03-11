import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { BrandLogo } from "@/components/layout/brand-logo";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  alternateHref,
  alternateLabel,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  alternateHref: string;
  alternateLabel: string;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr] xl:items-start">
      <div className="space-y-6">
        <Card className="overflow-hidden p-0">
          <div className="relative px-6 py-8 sm:px-8 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_84%_24%,rgba(15,118,110,0.12),transparent_26%)]" />
            <div className="relative">
              <BrandLogo href="/" size="hero" subtitle="AI planning for better outings" />

              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">{eyebrow}</p>
              <h1 className="mt-4 max-w-2xl font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{description}</p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Planner-led setup",
                    detail: "Tell the assistant what kind of outing you want and let it gather the important details.",
                  },
                  {
                    title: "Preferences stay saved",
                    detail: "Use your profile to keep dietary, accessibility, budget, and style defaults in one place.",
                  },
                  {
                    title: "Ready to plan fast",
                    detail: "Open the planner immediately and start shaping the trip with the assistant.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-[24px] border border-white/80 bg-white/82 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-cyan-50 text-teal-700">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <p className="mt-4 font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link href={alternateHref} className={buttonStyles({ variant: "secondary", size: "lg" })}>
                  {alternateLabel}
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="xl:sticky xl:top-28">{children}</div>
    </div>
  );
}
