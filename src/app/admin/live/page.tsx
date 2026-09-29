import { prisma } from "@/lib/prisma";
import { AdminLiveHeader } from "@/components/admin-live-header";
import { AdminLiveFeed, type LiveTask } from "@/components/admin-live-feed";

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
    <div className="mx-auto w-full max-w-3xl">
      <AdminLiveHeader count={initialTasks.length} />
      <AdminLiveFeed initialTasks={initialTasks} />
    </div>
  );
}
