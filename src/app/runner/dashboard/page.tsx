import { Category } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { presentPoolTask, runnerPoolInclude, runnerPoolWhere } from "@/lib/runnerPool";
import { getUserRating } from "@/lib/userRating";
import { StarRating } from "@/components/star-rating";
import Link from "next/link";
import { Radio } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CategoryFilter } from "@/components/category-filter";
import { LiveTaskFeed } from "./live-task-feed";

export default async function RunnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categoryParam } = await searchParams;
  const category =
    categoryParam && categoryParam in Category
      ? (categoryParam as Category)
      : undefined;

  const session = await getServerSession(authOptions);
  const runner = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    select: { category: true },
  });

  const rating = await getUserRating(session!.user.id);
  const rows = await prisma.task.findMany({
    where: runnerPoolWhere(category),
    orderBy: { createdAt: "desc" },
    include: runnerPoolInclude(session!.user.id),
  });
  const tasks = rows.map(presentPoolTask);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Available errands
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            Pick up a task near you.
            <StarRating value={rating.average} count={rating.count} />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CategoryFilter />
          <Link href="/runner/live" className={buttonVariants()}>
            <Radio />
            Go live
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <LiveTaskFeed
          initialTasks={tasks}
          runnerCategory={runner.category}
          categoryFilter={category}
        />
      </div>
    </div>
  );
}
