import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { categoryLabel } from "@/lib/categories";
import { getUserRating } from "@/lib/userRating";
import { StarRating } from "@/components/star-rating";
import { StatTile } from "@/components/stat-tile";

const FEEDBACK_LIMIT = 20;

// A person's public face in the app: who they are, their overall rating in
// stars, and the feedback they've received. No contact or payout details,
// those only ever appear on an errand you're actually part of. Which
// profiles a given viewer may open is decided by the route, this just
// renders one.
export async function ProfileView({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, category: true, createdAt: true },
  });
  if (!user || user.role === "ADMIN") {
    notFound();
  }

  const isRunner = user.role === "RUNNER";
  const [rating, completed, feedback] = await Promise.all([
    getUserRating(user.id),
    prisma.task.count({
      where: {
        status: "COMPLETED",
        ...(isRunner ? { runnerId: user.id } : { posterId: user.id }),
      },
    }),
    prisma.rating.findMany({
      where: { ratedUserId: user.id },
      orderBy: { createdAt: "desc" },
      take: FEEDBACK_LIMIT,
      include: {
        ratedBy: { select: { name: true } },
        task: { select: { title: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isRunner
          ? `Runner${user.category ? `, ${categoryLabel(user.category)}` : ""}`
          : "Poster"}{" "}
        · Member since{" "}
        {user.createdAt.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile
          label="Overall rating"
          value={<StarRating value={rating.average} count={rating.count} size="lg" />}
        />
        <StatTile
          label={isRunner ? "Errands completed" : "Errands posted and completed"}
          value={String(completed)}
        />
      </div>

      <h2 className="mt-10 font-heading text-lg font-semibold">Feedback</h2>
      {feedback.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium">No feedback yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ratings and comments show up here after a finished errand.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {feedback.map((item) => (
            <li key={item.id} className="rounded-lg border border-border bg-card p-4">
              <StarRating value={item.score} />
              {item.comment && <p className="mt-2 text-sm">{item.comment}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                {item.ratedBy.name} on &ldquo;{item.task.title}&rdquo; ·{" "}
                {item.createdAt.toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
