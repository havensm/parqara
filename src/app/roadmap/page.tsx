import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { generatedVisuals } from "@/lib/generated-assets";

import { buttonStyles } from "@/components/ui/button";

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16 sm:space-y-8 sm:pb-20">
      <section className="overflow-hidden rounded-[36px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,249,251,0.96))] px-6 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-8 sm:py-10 lg:px-10">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex rounded-full border border-white/90 bg-white/88 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-900/80 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
            Roadmap
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-[4rem] lg:leading-[0.98]">
            The next six months of customer releases.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            One clear timeline of what Parqara is planning to ship next for travelers, families, and groups.
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[40px] border border-white/80 bg-white/82 p-3 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:p-4 lg:p-5">
        <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,249,251,0.94))]">
          <Image
            src={generatedVisuals.roadmap.sixMonthTimeline}
            alt="Parqara six-month roadmap timeline showing customer-focused releases from April through September 2026."
            width={1536}
            height={1024}
            priority
            className="h-auto w-full"
            sizes="(min-width: 1280px) 1120px, (min-width: 768px) 92vw, 100vw"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,249,251,0.94))] px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="text-sm font-medium text-slate-500">Want early access to the releases on this timeline?</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">Start planning with Mara.</p>
        </div>
        <Link href="/signup" className={buttonStyles({ variant: "primary", size: "lg" })}>
          Create account
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
