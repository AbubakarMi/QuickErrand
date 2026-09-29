import { PageHeaderSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <Skeleton className="mt-6 h-64 w-full rounded-lg" />
    </div>
  );
}
