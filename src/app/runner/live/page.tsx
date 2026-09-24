import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { presentPoolTask, runnerPoolInclude, runnerPoolWhere } from "@/lib/runnerPool";
import { BroadcastHeader } from "@/components/broadcast-header";
import { LiveTaskFeed } from "../dashboard/live-task-feed";

export default async function RunnerLivePage() {
  const session = await getServerSession(authOptions);
  const runnerId = session!.user.id;

  const [runner, rows] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: runnerId },
      select: { category: true },
    }),
    prisma.task.findMany({
      where: runnerPoolWhere(),
      orderBy: { createdAt: "desc" },
      include: runnerPoolInclude(runnerId),
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BroadcastHeader />
      <LiveTaskFeed
        live
        initialTasks={rows.map(presentPoolTask)}
        runnerCategory={runner.category}
      />
    </div>
  );
}
