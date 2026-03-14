import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "skeleton-wave rounded-[18px] bg-[linear-gradient(90deg,rgba(223,233,243,0.82),rgba(247,250,255,0.98),rgba(223,233,243,0.82))]",
        className
      )}
    />
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={className} />;
}
