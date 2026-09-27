import { PageHeaderSkeleton, TaskRowSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeaderSkeleton />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 sm:h-7" />
          <Skeleton className="h-10 w-28 sm:h-8" />
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:mt-8">
        <TaskRowSkeleton />
        <TaskRowSkeleton />
        <TaskRowSkeleton />
      </div>
    </div>
  );
}
