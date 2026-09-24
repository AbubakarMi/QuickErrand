import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserRating } from "@/lib/userRating";
import { RunnerTaskDetailView } from "./task-detail-view";

export default async function RunnerTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const me = session!.user.id;

  const [found, runner] = await Promise.all([
    prisma.task.findUnique({
      where: { id },
      include: {
        poster: { select: { id: true, name: true, phone: true } },
        ratings: {
          select: { score: true, comment: true, ratedById: true, ratedUserId: true },
        },
        bids: {
          where: { runnerId: me },
          select: { id: true, price: true, counterPrice: true, status: true },
        },
        _count: { select: { bids: { where: { status: "OPEN" } } } },
      },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: me },
      select: { bankAccountNumber: true },
    }),
  ]);

  // Same access rules as GET /api/tasks/:id (which the page polls): the
  // runner it went to, any runner while it's open, and a runner who bid,
  // so one who lost still sees how it ended.
  const isAssigned = found?.runnerId === me;
  const myBid = found?.bids[0] ?? null;
  if (!found || !(isAssigned || found.status === "PENDING" || myBid)) {
    notFound();
  }
  // `bids` is just this runner's own row, already read into `myBid` above.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ratings, bids: _ownBidRows, _count, ...task } = found;

  const posterRating = await getUserRating(task.posterId);
  const pick = (r: (typeof ratings)[number] | undefined) =>
    r ? { score: r.score, comment: r.comment } : null;

  // Who the poster is (name, rating, profile) is fair game for anyone
  // deciding whether to bid. Their phone only goes to whoever is actually
  // assigned, and to nobody once it's cancelled or backed out.
  const showPhone = isAssigned && task.status !== "CANCELLED";
  const poster =
    task.status === "CANCELLED" && !isAssigned
      ? null
      : { ...task.poster, phone: showPhone ? task.poster.phone : null };

  return (
    <RunnerTaskDetailView
      runnerId={me}
      hasBankDetails={!!runner.bankAccountNumber}
      initialTask={{
        ...task,
        poster,
        posterRating,
        myBid,
        bidCount: _count.bids,
        myRating: pick(ratings.find((r) => r.ratedById === me)),
        ratingReceived: pick(ratings.find((r) => r.ratedUserId === me)),
      }}
    />
  );
}
