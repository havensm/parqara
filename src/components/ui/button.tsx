import type { ButtonHTMLAttributes } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-[18px] border font-semibold transition duration-200 active:translate-y-px active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary:
          "border-[rgba(13,48,69,0.18)] bg-[linear-gradient(180deg,#1a4258_0%,#17677b_100%)] !text-white shadow-[0_12px_28px_rgba(12,20,37,0.16)] [text-shadow:0_1px_0_rgba(8,17,30,0.18)] hover:-translate-y-0.5 hover:border-[rgba(13,48,69,0.24)] hover:shadow-[0_16px_34px_rgba(12,20,37,0.18)] [&_svg]:text-white",
        secondary:
          "border-[var(--card-border-strong)] bg-white text-[var(--foreground)] shadow-[0_10px_24px_rgba(12,20,37,0.06)] hover:-translate-y-0.5 hover:border-[rgba(18,109,100,0.18)] hover:bg-[rgba(248,251,255,0.96)]",
        ghost:
          "border-transparent bg-transparent text-[var(--muted-strong)] hover:bg-white/72 hover:text-[var(--foreground)]",
        accent:
          "border-[rgba(236,139,89,0.22)] bg-[linear-gradient(180deg,#f0a55f_0%,#ec8b59_100%)] text-white shadow-[0_12px_28px_rgba(236,139,89,0.18)] hover:-translate-y-0.5 hover:border-[rgba(236,139,89,0.28)] hover:shadow-[0_16px_34px_rgba(236,139,89,0.22)] [&_svg]:text-white",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-sm",
        xl: "h-14 px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export function Button({ className, size, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

