import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { StarRating } from "@/components/star-rating";
import { TimeAgo } from "@/components/time-ago";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/formatPrice";

const BID_STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  AWARDED: "Awarded",
  NOT_AWARDED: "Not awarded",
};

// The admin's view of one errand: everything on it, including the part
// nobody else gets to see all at once, every bid it received (the
// "negotiations"), not just the winning one. Read-only, same as the rest
// of the admin area.
export default async function AdminTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      poster: { select: { id: true, name: true } },
      runner: { select: { id: true, name: true } },
      bids: {
        orderBy: { createdAt: "asc" },
        include: { runner: { select: { id: true, name: true } } },
      },
      ratings: {
        include: { ratedBy: { select: { name: true } }, ratedUser: { select: { name: true } } },
      },
    },
  });
  if (!task) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href="/admin/tasks" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to errands
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{task.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {categoryLabel(task.category)} · {task.location} · {formatPrice(task.price)} ·{" "}
            {task.paymentMethod === "CASH" ? "Cash" : "Bank transfer"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <TimeAgo date={task.createdAt} prefix="Posted " />
          </p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      {task.status === "CANCELLED" && task.cancelReason && (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Cancelled: {task.cancelReason}
        </p>
      )}

      <p className="mt-6 text-sm text-foreground">{task.description}</p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Poster</p>
          <Link href={`/admin/users/${task.poster.id}`} className="mt-1 block text-sm font-medium hover:underline">
            {task.poster.name}
          </Link>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Runner</p>
          {task.runner ? (
            <Link href={`/admin/users/${task.runner.id}`} className="mt-1 block text-sm font-medium hover:underline">
              {task.runner.name}
            </Link>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Not yet awarded</p>
          )}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Bids ({task.bids.length})
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every price offered on this errand, including ones the poster never took.
        </p>
        {task.bids.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No bids were placed.</p>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {task.bids.map((bid) => (
              <li
                key={bid.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
              >
                <Link href={`/admin/users/${bid.runner.id}`} className="font-medium hover:underline">
                  {bid.runner.name}
                </Link>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium">{formatPrice(bid.price)}</span>
                  {bid.counterPrice != null && (
                    <span className="text-muted-foreground">
                      poster countered {formatPrice(bid.counterPrice)}
                    </span>
                  )}
                  <span
                    className={
                      bid.status === "AWARDED"
                        ? "rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                        : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {BID_STATUS_LABEL[bid.status] ?? bid.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {task.ratings.length > 0 && (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Ratings</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {task.ratings.map((rating) => (
              <li key={rating.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm">
                    <span className="font-medium">{rating.ratedBy.name}</span> rated{" "}
                    <span className="font-medium">{rating.ratedUser.name}</span>
                  </p>
                  <StarRating value={rating.score} />
                </div>
                {rating.comment && (
                  <p className="mt-2 text-sm text-muted-foreground">&ldquo;{rating.comment}&rdquo;</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {task.status === "COMPLETED" && (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Payment record</h2>
          <div className="mt-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            {task.paidAt ? (
              <p>Poster marked paid on {new Date(task.paidAt).toLocaleDateString()}.</p>
            ) : (
              <p>Not yet marked paid.</p>
            )}
            {task.paymentConfirmedAt ? (
              <p className="mt-1">
                Runner confirmed receipt on {new Date(task.paymentConfirmedAt).toLocaleDateString()}.
              </p>
            ) : (
              <p className="mt-1">Not yet confirmed by the runner.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
