import { cn } from "@/lib/utils";

// A pulsing placeholder block, the atom every route's loading.tsx composes
// into a rough copy of that page's real layout. Plain div, no animation
// library needed for a CSS opacity pulse.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  );
}
