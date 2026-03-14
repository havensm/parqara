import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  imageClassName?: string;
  priority?: boolean;
  size?: "compact" | "default" | "hero";
  subtitle?: string;
};

const sizeClasses = {
  compact: {
    image: "h-20 w-auto sm:h-24",
    subtitle: "text-xs uppercase tracking-[0.24em] text-slate-400",
    wrapper: "gap-2",
  },
  default: {
    image: "h-24 w-auto sm:h-28",
    subtitle: "text-sm text-slate-500",
    wrapper: "gap-3",
  },
  hero: {
    image: "h-28 w-auto sm:h-32",
    subtitle: "text-sm text-slate-500",
    wrapper: "gap-3",
  },
} as const;

export function BrandLogo({
  className,
  href,
  imageClassName,
  priority = false,
  size = "default",
  subtitle,
}: BrandLogoProps) {
  const styles = sizeClasses[size];
  const content = (
    <div className={cn("flex flex-col items-start", styles.wrapper, className)}>
      <Image
        src="/brand/parqara-logo-wordmark.png"
        alt="Parqara"
        width={1137}
        height={1012}
        priority={priority}
        className={cn(styles.image, "object-contain drop-shadow-[0_10px_22px_rgba(12,20,37,0.08)]", imageClassName)}
      />
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} aria-label="Parqara home">
      {content}
    </Link>
  );
}
