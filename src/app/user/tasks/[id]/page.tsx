import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserRating } from "@/lib/userRating";
import { getBidsForPoster } from "@/lib/bids";
import { UserTaskDetailView } from "./task-detail-view";

export default async function UserTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const found = await prisma.task.findUnique({
    where: { id },
    include: {
      ratings: {
        select: { score: true, comment: true, ratedById: true, ratedUserId: true },
      },
      runner: {
        select: {
          id: true,
          name: true,
          phone: true,
          bankAccountNumber: true,
          bankName: true,
        },
      },
    },
  });

  if (!found || found.posterId !== session!.user.id) {
    notFound();
  }
  const { ratings, ...task } = found;

  const runnerRating = task.runnerId ? await getUserRating(task.runnerId) : null;
  const pick = (r: (typeof ratings)[number] | undefined) =>
    r ? { score: r.score, comment: r.comment } : null;

  // Same rule as GET /api/tasks/:id: a cancelled errand keeps no contact
  // or payout details for the runner.
  const runner =
    task.status === "CANCELLED" && task.runner
      ? { ...task.runner, phone: null, bankAccountNumber: null, bankName: null }
      : task.runner;

  const bids = task.status === "PENDING" ? await getBidsForPoster(task.id) : [];

  return (
    <UserTaskDetailView
      initialTask={{
        ...task,
        runner,
        runnerRating,
        bids,
        myRating: pick(ratings.find((r) => r.ratedById === session!.user.id)),
        ratingReceived: pick(ratings.find((r) => r.ratedUserId === session!.user.id)),
      }}
    />
  );
}
