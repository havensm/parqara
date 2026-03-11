import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SelectionTile({
  children,
  description,
  selected,
  className,
  onClick,
}: {
  children: ReactNode;
  description?: string;
  selected: boolean;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group rounded-[28px] border px-5 py-5 text-left transition duration-200",
        selected
          ? "border-[#b9ddd6] bg-[linear-gradient(180deg,rgba(238,252,248,0.98)_0%,rgba(227,247,244,0.98)_100%)] shadow-[0_14px_32px_rgba(27,107,99,0.08)]"
          : "border-slate-200 bg-white hover:border-[#c9d8d1] hover:bg-[#fbfdfc]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[1.02rem] font-semibold tracking-tight text-slate-950">{children}</div>
          {description ? <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p> : null}
        </div>
        <div className={cn("mt-1 h-5 w-5 rounded-full border transition", selected ? "border-[#1b6b63] bg-[#1b6b63] shadow-[0_0_0_4px_rgba(27,107,99,0.1)]" : "border-slate-300 bg-white")} />
      </div>
    </button>
  );
}

export function ChoiceChip({
  children,
  selected,
  onClick,
}: {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2.5 text-sm font-semibold transition duration-200",
        selected ? "border-[#b9ddd6] bg-[#edf8f4] text-[#18544d]" : "border-slate-200 bg-white text-slate-600 hover:border-[#c9d8d1]"
      )}
    >
      {children}
    </button>
  );
}
