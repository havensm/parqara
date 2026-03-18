import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CalendarRange, Route, Users } from "lucide-react";

import { generatedVisuals } from "@/lib/generated-assets";

import { BrandLogo } from "@/components/layout/brand-logo";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VisualShowcase } from "@/components/ui/visual-showcase";

const authHighlights = [
  {
    icon: Users,
    title: "Shared trip context",
    detail: "Keep the group, goals, and must-dos in one place.",
    tone: "bg-[rgba(238,253,249,0.92)] text-[var(--teal-700)]",
  },
  {
    icon: Route,
    title: "Readable route plan",
    detail: "Turn the day into a sequence the whole group can follow.",
    tone: "bg-[rgba(239,245,255,0.92)] text-[var(--sky-700)]",
  },
  {
    icon: CalendarRange,
    title: "Faster next trip",
    detail: "Saved preferences make the next outing easier to start.",
    tone: "bg-[rgba(246,240,255,0.92)] text-[#6d4fd6]",
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
  panelOrder?: "content-first" | "panel-first";
};

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  alternateHref,
  alternateLabel,
  variant = "default",
  panelOrder = "content-first",
}: AuthShellProps) {
  const storyPanel = (
    <Card className="overflow-hidden border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,250,252,0.92))] p-0 shadow-[0_24px_64px_rgba(12,20,37,0.1)]">
      <div className="relative px-6 py-6 sm:px-8 sm:py-8">
        <div className="space-y-6">
          <BrandLogo href="/" size="hero" subtitle="One place to shape the trip" imageClassName="h-24 w-auto sm:h-28" />

          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">{eyebrow}</p>
            <h1 className="max-w-xl font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-[3.2rem] sm:leading-[0.95]">
              {title}
            </h1>
            <p className="max-w-xl text-base leading-7 text-[var(--muted)]">{description}</p>
          </div>

          <VisualShowcase
            src={generatedVisuals.settings.profile}
            alt="Parqara account onboarding visual"
            eyebrow="Premium planning"
            title="Mara plus a richer planner workspace from the start."
            description="The product now feels more like a polished consumer app than a static signup form."
            aspect="landscape"
          />

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {authHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[24px] border border-white/82 bg-white/84 px-4 py-4 shadow-[0_12px_28px_rgba(12,20,37,0.08)]">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] ${item.tone}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{item.title}</p>
                      <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">{item.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={alternateHref} className={`${buttonStyles({ variant: "secondary", size: "lg" })} gap-2`}>
              {alternateLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="glass-chip inline-flex items-center px-4 py-2 text-sm text-[var(--muted)]">
              Free manual planning, Mara on Plus
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  if (variant === "minimal") {
    return (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(400px,0.78fr)] xl:items-start">
        {panelOrder === "content-first" ? storyPanel : <div className="xl:order-2">{storyPanel}</div>}
        <div className={panelOrder === "panel-first" ? "xl:order-1" : "xl:order-2"}>{children}</div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr] xl:items-start">
      {storyPanel}
      <div className="xl:sticky xl:top-24">{children}</div>
    </div>
  );
}

