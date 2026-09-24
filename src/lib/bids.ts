import { BidStatus, type Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { UserRating } from "@/lib/userRating";

export type BidView = {
  id: string;
  price: number;
  counterPrice: number | null;
  createdAt: Date | string;
  runner: { id: string; name: string; category: Category | null };
  rating: UserRating;
  completed: number;
};

// The open bids on an errand as the poster needs to see them: who bid, what
// they want, and enough of a track record (stars, errands completed) to
// choose between them. Ratings and completed counts come in two grouped
// queries rather than one per bidder.
export async function getBidsForPoster(taskId: string): Promise<BidView[]> {
  const bids = await prisma.bid.findMany({
    where: { taskId, status: BidStatus.OPEN },
    orderBy: { createdAt: "asc" },
    include: { runner: { select: { id: true, name: true, category: true } } },
  });
  if (bids.length === 0) return [];

  const runnerIds = bids.map((b) => b.runnerId);
  const [ratings, completed] = await Promise.all([
    prisma.rating.groupBy({
      by: ["ratedUserId"],
      where: { ratedUserId: { in: runnerIds } },
      _avg: { score: true },
      _count: { score: true },
    }),
    prisma.task.groupBy({
      by: ["runnerId"],
      where: { runnerId: { in: runnerIds }, status: "COMPLETED" },
      _count: { _all: true },
    }),
  ]);

  return bids.map((b) => {
    const r = ratings.find((x) => x.ratedUserId === b.runnerId);
    const c = completed.find((x) => x.runnerId === b.runnerId);
    return {
      id: b.id,
      price: b.price,
      counterPrice: b.counterPrice,
      createdAt: b.createdAt,
      runner: b.runner,
      rating: { average: r?._avg.score ?? null, count: r?._count.score ?? 0 },
      completed: c?._count._all ?? 0,
    };
  });
}
