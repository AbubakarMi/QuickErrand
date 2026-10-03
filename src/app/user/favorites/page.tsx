import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserRating } from "@/lib/userRating";
import { StarRating } from "@/components/star-rating";
import { FavoriteButton } from "@/components/favorite-button";
import { categoryLabel } from "@/lib/categories";

export default async function UserFavoritesPage() {
  const session = await getServerSession(authOptions);
  const favorites = await prisma.favorite.findMany({
    where: { posterId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      runner: { select: { id: true, name: true, category: true } },
    },
  });

  const runners = await Promise.all(
    favorites.map(async (f) => ({
      ...f.runner,
      rating: await getUserRating(f.runner.id),
    })),
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Your favorite runners</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Runners you&apos;ve saved, for a quick hire without digging back through history.
      </p>

      {runners.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center sm:p-10">
          <p className="text-sm font-medium">No favorites yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a runner&apos;s profile after an errand and save them if you&apos;d hire them again.
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {runners.map((runner) => (
            <li
              key={runner.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <Link href={`/user/profile/${runner.id}`} className="font-medium hover:underline">
                  {runner.name}
                </Link>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {runner.category ? categoryLabel(runner.category) : "Runner"}
                </p>
                <div className="mt-1.5">
                  <StarRating value={runner.rating.average} count={runner.rating.count} />
                </div>
              </div>
              <FavoriteButton runnerId={runner.id} initialFavorited />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
