import { PageHeaderSkeleton, TaskRowSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeaderSkeleton />
        <Skeleton className="h-10 w-40 sm:h-8" />
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:mt-8">
        <TaskRowSkeleton />
        <TaskRowSkeleton />
        <TaskRowSkeleton />
      </div>
    </div>
  );
}
