import { prisma } from "@/lib/prisma";
import { AdminLiveView } from "@/components/admin-live-view";
import type { LiveTask } from "@/components/admin-live-feed";

const LIMIT = 50;

export default async function AdminLivePage() {
  const tasks = await prisma.task.findMany({
    where: { status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS"] } },
    orderBy: { updatedAt: "desc" },
    take: LIMIT,
    include: {
      poster: { select: { name: true } },
      runner: { select: { name: true } },
      _count: { select: { bids: { where: { status: "OPEN" } } } },
    },
  });

  const initialTasks: LiveTask[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category,
    price: t.price,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    poster: t.poster,
    runner: t.runner,
    bidCount: t._count.bids,
  }));

  return (
    <div>
      <h1 className="text-center text-2xl font-semibold tracking-tight">Live</h1>
      <p className="mx-auto mt-1 max-w-md text-center text-sm text-muted-foreground">
        Everything posted, being negotiated, or already awarded and running
        across the platform, updating on its own.
      </p>
      <div className="mt-8">
        <AdminLiveView initialTasks={initialTasks} />
      </div>
    </div>
  );
}
