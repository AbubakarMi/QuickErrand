import { prisma } from "@/lib/prisma";

export type UserRating = { average: number | null; count: number };

// Everyone's overall rating, runner or poster: the average of every rating
// they've received. `average` is null until there's at least one, so
// callers can say "No ratings yet" instead of showing a misleading zero.
export async function getUserRating(userId: string): Promise<UserRating> {
  const result = await prisma.rating.aggregate({
    where: { ratedUserId: userId },
    _avg: { score: true },
    _count: { score: true },
  });
  return { average: result._avg.score, count: result._count.score };
}
