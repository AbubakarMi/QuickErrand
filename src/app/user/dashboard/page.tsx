import Link from "next/link";
import { Plus } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { TaskStatusActionButton } from "@/components/task-status-action-button";
import { TimeAgo } from "@/components/time-ago";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/formatPrice";

export default async function UserDashboardPage() {
  // The layout above already redirects anyone without a USER session, so
  // this session is guaranteed non-null here.
  const session = await getServerSession(authOptions);
  const tasks = await prisma.task.findMany({
    where: { posterId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      runner: { select: { name: true } },
      _count: { select: { bids: { where: { status: "OPEN" } } } },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Your errands</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything you&apos;ve posted, with live status.
          </p>
        </div>
        <Link href="/user/tasks/new" className={buttonVariants()}>
          <Plus />
          Post an errand
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center sm:p-10">
          <p className="text-sm font-medium">No errands yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Post your first one and nearby runners can bid on it.
          </p>
          <Link href="/user/tasks/new" className={buttonVariants({ className: "mt-4" })}>
            Post an errand
          </Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3 sm:mt-8">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <Link href={`/user/tasks/${task.id}`} className="min-w-0 flex-1">
                <p className="font-medium hover:underline">{task.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {categoryLabel(task.category)} · {task.location} · {formatPrice(task.price)}
                  {task.runner
                    ? ` · ${task.runner.name}${task.status === "CANCELLED" ? " backed out" : ""}`
                    : ""}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <TimeAgo date={task.createdAt} prefix="Posted " />
                </p>
              </Link>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {task.status === "PENDING" && task._count.bids > 0 && (
                  <span className="rounded-full bg-brand-coral px-2 py-0.5 text-xs font-medium text-brand-coral-foreground">
                    {task._count.bids} bid{task._count.bids === 1 ? "" : "s"}
                  </span>
                )}
                <StatusBadge status={task.status} />
                {task.status === "PENDING" && (
                  <TaskStatusActionButton taskId={task.id} newStatus="CANCELLED" variant="outline">
                    Cancel
                  </TaskStatusActionButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
