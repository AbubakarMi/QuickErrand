import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RunnerTaskDetailView } from "./task-detail-view";

export default async function RunnerTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const [task, runner] = await Promise.all([
    prisma.task.findUnique({
      where: { id },
      include: { poster: { select: { name: true, phone: true } } },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: session!.user.id },
      select: { bankAccountNumber: true },
    }),
  ]);

  const isAssignedRunner = task?.runnerId === session!.user.id;
  // A still-PENDING task is previewable by any runner (it's what they're
  // browsing before deciding to accept), the poster's contact only goes
  // to whoever actually ends up assigned. Same rule GET /api/tasks/:id
  // enforces for the polling refetches on this page.
  const isMyOffer = task?.negotiatedByRunnerId === session!.user.id;
  // An errand the poster reserved for another runner isn't open to browse.
  const isOpenToPreview =
    task?.status === "PENDING" && (!task.offerAgreedAt || isMyOffer);

  if (!task || !(isAssignedRunner || isOpenToPreview)) {
    notFound();
  }

  return (
    <RunnerTaskDetailView
      runnerId={session!.user.id}
      hasBankDetails={!!runner.bankAccountNumber}
      initialTask={{
        ...task,
        negotiatedPrice: isMyOffer ? task.negotiatedPrice : null,
        negotiatedByRunnerId: isMyOffer ? task.negotiatedByRunnerId : null,
        offerAgreedAt: isMyOffer ? task.offerAgreedAt : null,
        offerBy: isMyOffer ? task.offerBy : null,
        // Nothing to share once a runner has backed out or it's cancelled.
        poster:
          isAssignedRunner && task.status !== "CANCELLED" ? task.poster : null,
      }}
    />
  );
}
