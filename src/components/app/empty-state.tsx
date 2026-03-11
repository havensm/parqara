import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  eyebrow,
  visual,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  eyebrow?: string;
  visual?: ReactNode;
}) {
  return (
    <Card className="p-8 sm:p-10">
      <div className="mx-auto max-w-2xl text-center">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">{eyebrow}</p> : null}
        <div className="mt-6 flex justify-center">{visual ?? <div className="h-32 w-32 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.2),transparent_60%),linear-gradient(180deg,#f7fbff_0%,#eef6fb_100%)]" />}</div>
        <h2 className="mt-8 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-slate-600">{description}</p>
        <Link href={actionHref} className={buttonStyles({ variant: "primary", size: "lg" }) + " mt-8"}>
          {actionLabel}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
