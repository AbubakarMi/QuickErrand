import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = { sm: "size-4", md: "size-5", lg: "size-6" } as const;

function Row({ className, filled }: { className: string; filled: boolean }) {
  return (
    <span className="flex">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            className,
            filled ? "fill-brand-coral text-brand-coral" : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

// Ratings are shown as stars, never as a bare number. An average fills
// stars fractionally (4.3 fills four and a bit), the count sits beside it
// in muted text since one 5-star rating and two hundred aren't the same
// thing. Plain markup with no hooks, so it works in server and client
// components alike.
export function StarRating({
  value,
  count,
  size = "sm",
}: {
  value: number | null;
  count?: number;
  size?: keyof typeof SIZES;
}) {
  if (value === null) {
    return <span className="text-sm text-muted-foreground">No ratings yet</span>;
  }

  const filledPct = Math.max(0, Math.min(5, value)) * 20;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="relative inline-flex"
        role="img"
        aria-label={`${value.toFixed(1)} out of 5 stars`}
      >
        <Row className={SIZES[size]} filled={false} />
        <span
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${filledPct}%` }}
        >
          <Row className={cn(SIZES[size], "shrink-0")} filled />
        </span>
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </span>
  );
}
