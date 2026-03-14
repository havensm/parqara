"use client";

import type { ComponentProps } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex min-h-12 items-center gap-1 rounded-full border border-[var(--card-border)] bg-white/86 p-1 text-[var(--muted)] shadow-[0_14px_34px_rgba(12,20,37,0.08)] backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] data-[state=active]:bg-[linear-gradient(135deg,#0e2b43_0%,#176b64_48%,#1cc6aa_78%,#63a7ff_100%)] data-[state=active]:text-white data-[state=active]:shadow-[0_18px_38px_rgba(18,109,100,0.2)]",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-5 outline-none", className)} {...props} />;
}
