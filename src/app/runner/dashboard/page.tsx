import { Category } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { presentPoolTask, runnerPoolWhere } from "@/lib/runnerPool";
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
    select: { category: true, bankAccountNumber: true },
  });

  const rows = await prisma.task.findMany({
    where: runnerPoolWhere(session!.user.id, category),
    orderBy: { createdAt: "desc" },
    include: { poster: { select: { name: true } } },
  });
  const tasks = rows.map((row) => presentPoolTask(row, session!.user.id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Available errands
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick up a task near you.
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
          hasBankDetails={!!runner.bankAccountNumber}
        />
      </div>
    </div>
  );
}
