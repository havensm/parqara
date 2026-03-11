import Link from "next/link";
import { Database } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ParksUnavailableStateProps = {
  actionHref?: string;
  actionLabel?: string;
  description?: string;
  title?: string;
};

export function ParksUnavailableState({
  actionHref,
  actionLabel,
  description = "Parqara needs at least one production park catalog loaded before people can create trips.",
  title = "No park catalog is configured yet.",
}: ParksUnavailableStateProps) {
  return (
    <Card className="p-8 sm:p-10">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Production setup</p>
        <div className="mt-6 flex justify-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.2),transparent_60%),linear-gradient(180deg,#f7fbff_0%,#eef6fb_100%)] text-teal-700">
            <Database className="h-12 w-12" />
          </div>
        </div>
        <h2 className="mt-8 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-slate-600">{description}</p>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className={buttonStyles({ variant: "primary", size: "lg" }) + " mt-8"}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
