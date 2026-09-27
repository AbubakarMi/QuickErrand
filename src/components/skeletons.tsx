import { Skeleton } from "@/components/ui/skeleton";

// The handful of shapes every loading.tsx composes into a rough copy of
// its real page, so the same list-row or stat-tile skeleton doesn't get
// rebuilt six times over. Not a page-builder, just the repeated atoms.

export function PageHeaderSkeleton() {
  return (
    <div>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />
    </div>
  );
}

export function StatTileSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2 h-6 w-20" />
    </div>
  );
}

export function TaskRowSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3 max-w-56" />
        <Skeleton className="h-3 w-1/2 max-w-40" />
      </div>
      <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
    </div>
  );
}

// A task/errand detail page: title and meta, a status-sized badge, a
// description paragraph, then a contact-card-shaped block.
export function TaskDetailSkeleton() {
  return (
    <div>
      <Skeleton className="h-3 w-24" />
      <div className="mt-2 flex items-start justify-between gap-4">
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="h-6 w-24 shrink-0 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <div className="mt-6 rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-4 w-32" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
    </div>
  );
}

// A profile page: name and rating up top, a handful of feedback rows below.
export function ProfileSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="mt-8 space-y-3">
        <TaskRowSkeleton />
        <TaskRowSkeleton />
      </div>
    </div>
  );
}
