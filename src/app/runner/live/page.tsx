import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { presentPoolTask, runnerPoolWhere } from "@/lib/runnerPool";
import { BroadcastHeader } from "@/components/broadcast-header";
import { LiveTaskFeed } from "../dashboard/live-task-feed";

export default async function RunnerLivePage() {
  const session = await getServerSession(authOptions);
  const runnerId = session!.user.id;

  const [runner, rows] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: runnerId },
      select: { category: true, bankAccountNumber: true },
    }),
    prisma.task.findMany({
      where: runnerPoolWhere(runnerId),
      orderBy: { createdAt: "desc" },
      include: { poster: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BroadcastHeader />
      <LiveTaskFeed
        live
        initialTasks={rows.map((row) => presentPoolTask(row, runnerId))}
        runnerCategory={runner.category}
        hasBankDetails={!!runner.bankAccountNumber}
      />
    </div>
  );
}
