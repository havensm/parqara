import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function VisualShowcase({
  src,
  alt,
  eyebrow,
  title,
  description,
  chips = [],
  children,
  priority = false,
  aspect = "landscape",
  imageClassName,
  className,
}: {
  src: string;
  alt: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  chips?: string[];
  children?: ReactNode;
  priority?: boolean;
  aspect?: "landscape" | "portrait" | "square";
  imageClassName?: string;
  className?: string;
}) {
  const aspectClassName =
    aspect === "portrait" ? "aspect-[4/5]" : aspect === "square" ? "aspect-square" : "aspect-[16/11]";

  return (
    <div className={cn("surface-shell panel-grid relative overflow-hidden rounded-[34px] p-3 sm:p-4", className)}>
      <div className={cn("relative overflow-hidden rounded-[28px]", aspectClassName)}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={
            aspect === "portrait"
              ? "(min-width: 1280px) 28vw, (min-width: 768px) 42vw, 100vw"
              : "(min-width: 1280px) 42vw, (min-width: 768px) 58vw, 100vw"
          }
          className={cn("object-cover object-center", imageClassName)}
        />
        {/* The overlay stack normalizes wildly different art assets into one consistent premium product treatment. */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,30,0.06)_0%,rgba(8,17,30,0.18)_48%,rgba(8,17,30,0.68)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(115,154,255,0.18),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(255,184,122,0.14),transparent_22%)]" />

        {eyebrow || title || description || chips.length || children ? (
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="rounded-[26px] border border-white/18 bg-[linear-gradient(180deg,rgba(10,22,38,0.76),rgba(10,22,38,0.92))] p-4 text-white shadow-[0_24px_54px_rgba(8,17,30,0.24)] backdrop-blur-xl sm:p-5">
              {eyebrow ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/65">{eyebrow}</p>
              ) : null}
              {title ? (
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-white sm:text-[1.9rem]">
                  {title}
                </h3>
              ) : null}
              {description ? <p className="mt-2 text-sm leading-6 text-white/72 sm:text-[15px]">{description}</p> : null}
              {chips.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/82"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}
              {children ? <div className="mt-4">{children}</div> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
