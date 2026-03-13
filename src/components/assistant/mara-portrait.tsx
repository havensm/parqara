import Image from "next/image";

import { cn } from "@/lib/utils";

type MaraPortraitProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClassNames = {
  sm: "h-14 w-14 rounded-[18px]",
  md: "h-24 w-24 rounded-[24px]",
  lg: "h-32 w-32 rounded-[30px]",
} as const;

export function MaraPortrait({ size = "md", className }: MaraPortraitProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-white/80 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(242,248,247,0.98))] shadow-[0_16px_40px_rgba(15,23,42,0.08)]",
        sizeClassNames[size],
        className
      )}
    >
      <Image
        src="/characters/mara-portrait-openai.png"
        alt="Portrait illustration of Mara, Parqara's trip planning concierge"
        fill
        sizes={size === "lg" ? "128px" : size === "md" ? "96px" : "56px"}
        className="object-cover object-center"
        priority={size !== "sm"}
      />
    </div>
  );
}


