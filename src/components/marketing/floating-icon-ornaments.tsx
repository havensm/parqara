import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type FloatingIconItem = {
  icon: LucideIcon;
  positionClass: string;
  toneClass: string;
  animationClass?: string;
  delay?: string;
  sizeClass?: string;
};

export function FloatingIconOrnaments({
  className,
  items,
}: {
  className?: string;
  items: readonly FloatingIconItem[];
}) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 hidden xl:block", className)}>
      {items.map((item, index) => {
        const Icon = item.icon;

        return (
          <div key={`${item.positionClass}-${index}`} className={cn("absolute", item.positionClass)}>
            <div
              className={cn(
                "rounded-[24px] border border-white/90 bg-white/82 p-2.5 shadow-[0_18px_38px_rgba(15,23,42,0.06)] backdrop-blur-xl",
                item.animationClass ?? "ambient-icon-bob"
              )}
              style={item.delay ? { animationDelay: item.delay } : undefined}
            >
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-[16px]", item.toneClass, item.sizeClass)}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
