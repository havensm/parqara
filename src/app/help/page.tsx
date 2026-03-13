import type { ReactNode } from "react";
import { CircleHelp, LifeBuoy, Search } from "lucide-react";

import { getCurrentUserState } from "@/lib/auth/guards";

import { HelpCenter } from "@/components/help/help-center";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function HelpPage() {
  const user = await getCurrentUserState();
  const displayName = user?.firstName ?? user?.name ?? user?.email ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16 sm:space-y-6 sm:pb-20">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),linear-gradient(180deg,rgba(248,252,255,0.98),rgba(255,255,255,0.98))] px-6 py-6 sm:px-8 sm:py-7 lg:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700/70">Help</p>
            <h1 className="mt-3 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Search the FAQ.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Find quick answers about planning, Mara, sharing, notifications, and billing.
            </p>
          </div>
          <div className="grid gap-3 bg-white px-6 py-5 sm:px-7 md:grid-cols-3 xl:grid-cols-1">
            <HelpStatCard icon={<CircleHelp className="h-5 w-5" />} label="FAQ" value="Search common answers" tone="teal" />
            <HelpStatCard icon={<Search className="h-5 w-5" />} label="Search" value="Find the right topic fast" tone="sky" />
            <HelpStatCard icon={<LifeBuoy className="h-5 w-5" />} label="Signed in as" value={displayName ?? "Guest"} tone="amber" />
          </div>
        </div>
      </Card>

      <HelpCenter user={user ? { email: user.email, name: displayName ?? user.email } : null} />
    </div>
  );
}

function HelpStatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "amber" | "sky" | "teal";
}) {
  const toneClassNames = {
    amber: "bg-amber-100 text-amber-700",
    sky: "bg-sky-100 text-sky-700",
    teal: "bg-teal-100 text-teal-700",
  } as const;

  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="neutral">{label}</Badge>
        <div className={`flex h-9 w-9 items-center justify-center rounded-[14px] ${toneClassNames[tone]}`}>{icon}</div>
      </div>
      <p className="mt-3 text-base font-semibold leading-6 text-slate-950">{value}</p>
    </div>
  );
}
