import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import { buttonStyles } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";

export function UpgradeBanner({
  title,
  detail,
  href,
  label,
  className,
  tone = "teal",
}: {
  title: string;
  detail: string;
  href: string;
  label: string;
  className?: string;
  tone?: "amber" | "indigo" | "sky" | "teal";
}) {
  const toneClassNames = {
    amber: "bg-[radial-gradient(circle_at_top_left,rgba(245,179,66,0.18),transparent_32%),linear-gradient(180deg,rgba(255,249,239,0.98),rgba(255,255,255,0.98))]",
    indigo: "bg-[radial-gradient(circle_at_top_left,rgba(139,118,255,0.18),transparent_32%),linear-gradient(180deg,rgba(246,244,255,0.98),rgba(255,255,255,0.98))]",
    sky: "bg-[radial-gradient(circle_at_top_left,rgba(75,159,255,0.18),transparent_32%),linear-gradient(180deg,rgba(241,247,255,0.98),rgba(255,255,255,0.98))]",
    teal: "bg-[radial-gradient(circle_at_top_left,rgba(23,183,162,0.18),transparent_32%),linear-gradient(180deg,rgba(241,252,249,0.98),rgba(255,255,255,0.98))]",
  } as const;

  return (
    <div className={cn("rounded-[28px] border border-[var(--card-border)] p-5 shadow-[var(--shadow-soft)]", toneClassNames[tone], className)}>
      <div className="flex flex-wrap items-center gap-3">
        <StatusChip label="Upgrade" tone={tone} />
        <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-white/88 text-[var(--teal-700)] shadow-[0_12px_26px_rgba(15,23,42,0.06)]">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
      </div>
      <h3 className="mt-4 text-xl font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
      <Link href={href} className={buttonStyles({ variant: "primary", size: "default" }) + " mt-5 w-full justify-center sm:w-auto"}>
        {label}
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
