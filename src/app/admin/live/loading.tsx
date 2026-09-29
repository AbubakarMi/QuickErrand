import { TaskRowSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mx-auto h-7 w-24" />
      <Skeleton className="mx-auto mt-2 h-4 w-72 max-w-full" />
      <div className="mx-auto mt-8 aspect-square w-full max-w-[560px]">
        <Skeleton className="size-full rounded-full" />
      </div>
      <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-3">
        <TaskRowSkeleton />
        <TaskRowSkeleton />
        <TaskRowSkeleton />
      </div>
    </div>
  );
}
