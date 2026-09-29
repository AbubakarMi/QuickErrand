import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Prev/Next, server-rendered as plain links (?page=N), no client state
// needed. Both admin list pages use this identically.
export function PaginationLinks({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={`${basePath}?page=${page - 1}`}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: cn(page <= 1 && "pointer-events-none opacity-50"),
          })}
        >
          Previous
        </Link>
        <Link
          href={`${basePath}?page=${page + 1}`}
          aria-disabled={page >= totalPages}
          tabIndex={page >= totalPages ? -1 : undefined}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: cn(page >= totalPages && "pointer-events-none opacity-50"),
          })}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
