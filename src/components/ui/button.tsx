import type { ButtonHTMLAttributes } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonStyles = cva(
  "inline-flex items-center justify-center rounded-full border text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b6b63]/25 disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[#1b6b63] !text-[#f7fffd] shadow-[0_16px_32px_rgba(27,107,99,0.18)] hover:translate-y-[-1px] hover:bg-[#165b55] hover:!text-[#f7fffd] visited:!text-[#f7fffd] [&_svg]:!text-[#f7fffd]",
        secondary:
          "border-[rgba(18,37,31,0.12)] bg-white text-[#12251f] shadow-[0_6px_18px_rgba(24,41,36,0.04)] hover:border-[#1b6b63]/24 hover:bg-[#faf7f1]",
        ghost: "border-transparent text-[#17312b] hover:bg-[#edf2ec] hover:text-[#10241f]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-sm",
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

