import { PageHeaderSkeleton, StatTileSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
      </div>
      <Skeleton className="mt-10 h-48 w-full rounded-lg" />
      <Skeleton className="mt-10 h-48 w-full rounded-lg" />
    </div>
  );
}
