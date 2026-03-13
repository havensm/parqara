import { cn } from "@/lib/utils";

const toneClassNames = {
  amber: "border-amber-100 bg-amber-50/90 text-amber-700",
  sky: "border-sky-100 bg-sky-50/90 text-sky-700",
  teal: "border-teal-100 bg-teal-50/90 text-teal-700",
  violet: "border-violet-100 bg-violet-50/90 text-violet-700",
} as const;

export function PlannerSectionKicker({
  emoji,
  label,
  tone = "teal",
  className,
}: {
  emoji: string;
  label: string;
  tone?: keyof typeof toneClassNames;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em]",
        toneClassNames[tone],
        className
      )}
    >
      <span aria-hidden className="text-sm leading-none">
        {emoji}
      </span>
      <span>{label}</span>
    </div>
  );
}
