import { Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { categoryLabel } from "@/lib/categories";
import { CategoryFilter } from "@/components/category-filter";
import { TaskStatusActionButton } from "@/components/task-status-action-button";

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

  const tasks = await prisma.task.findMany({
    where: { status: "PENDING", ...(category ? { category } : {}) },
    orderBy: { createdAt: "desc" },
    include: { poster: { select: { name: true } } },
  });

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
        <CategoryFilter />
      </div>

      {tasks.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-medium">Nothing open right now</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {category
              ? "No pending errands in this category yet. Try another one."
              : "Check back soon, new errands show up here as they're posted."}
          </p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{task.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {categoryLabel(task.category)} · {task.location} · posted by{" "}
                  {task.poster.name}
                </p>
              </div>
              <TaskStatusActionButton taskId={task.id} newStatus="ACCEPTED">
                Accept
              </TaskStatusActionButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
