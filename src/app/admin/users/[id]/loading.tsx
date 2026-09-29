import { ProfileSkeleton, TaskRowSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-16 w-full rounded-lg" />
      <div className="mt-6">
        <ProfileSkeleton />
      </div>
      <div className="mt-10 flex flex-col gap-3">
        <TaskRowSkeleton />
        <TaskRowSkeleton />
      </div>
    </div>
  );
}
