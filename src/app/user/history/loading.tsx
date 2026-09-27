import { PageHeaderSkeleton, StatTileSkeleton, TaskRowSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
      </div>
      <div className="mt-8 flex flex-col gap-3">
        <TaskRowSkeleton />
        <TaskRowSkeleton />
        <TaskRowSkeleton />
      </div>
    </div>
  );
}
