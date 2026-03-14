import { cn } from "@/lib/utils";

const toneClasses = {
  teal: "border-[rgba(23,183,162,0.2)] bg-[rgba(237,251,248,0.94)] text-[var(--teal-700)]",
  sky: "border-[rgba(75,159,255,0.18)] bg-[rgba(238,246,255,0.94)] text-[var(--sky-700)]",
  coral: "border-[rgba(255,140,113,0.2)] bg-[rgba(255,242,238,0.94)] text-[#c95b3f]",
  amber: "border-[rgba(245,179,66,0.2)] bg-[rgba(255,248,235,0.96)] text-[var(--amber-700)]",
  indigo: "border-[rgba(139,118,255,0.18)] bg-[rgba(244,241,255,0.96)] text-[#5f4ee0]",
  neutral: "border-[rgba(109,138,168,0.18)] bg-[rgba(246,249,252,0.94)] text-[var(--muted-strong)]",
} as const;

export function StatusChip({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: keyof typeof toneClasses;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
        toneClasses[tone],
        className
      )}
    >
      {label}
    </span>
  );
}
