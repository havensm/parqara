import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  priority?: boolean;
  size?: "compact" | "default" | "hero";
  subtitle?: string;
};

const sizeClasses = {
  compact: {
    image: "h-14 w-auto sm:h-16",
    subtitle: "text-xs uppercase tracking-[0.24em] text-slate-400",
    wrapper: "gap-2",
  },
  default: {
    image: "h-16 w-auto sm:h-20",
    subtitle: "text-sm text-slate-500",
    wrapper: "gap-3",
  },
  hero: {
    image: "h-20 w-auto sm:h-24",
    subtitle: "text-sm text-slate-500",
    wrapper: "gap-3",
  },
} as const;

export function BrandLogo({
  className,
  href,
  priority = false,
  size = "default",
  subtitle,
}: BrandLogoProps) {
  const styles = sizeClasses[size];
  const content = (
    <div className={cn("flex flex-col items-start", styles.wrapper, className)}>
      <Image
        src="/brand/parqara-logo.png"
        alt="Parqara"
        width={2752}
        height={1536}
        priority={priority}
        className={styles.image}
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



