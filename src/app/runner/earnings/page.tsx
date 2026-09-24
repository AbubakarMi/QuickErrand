import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/formatPrice";
import { paymentState, type PaymentState } from "@/lib/paymentState";
import { getUserRating } from "@/lib/userRating";
import { StarRating } from "@/components/star-rating";
import { StatTile } from "@/components/stat-tile";

const RUNNER_LABEL: Record<PaymentState, string> = {
  UNPAID: "Waiting for the poster to pay",
  PAID: "Poster says paid, confirm it",
  CONFIRMED: "Received",
};

export default async function RunnerEarningsPage() {
  const session = await getServerSession(authOptions);
  const rating = await getUserRating(session!.user.id);
  const runs = await prisma.task.findMany({
    where: { runnerId: session!.user.id, status: "COMPLETED" },
    orderBy: { updatedAt: "desc" },
    include: { poster: { select: { name: true } } },
  });

  const received = runs
    .filter((r) => paymentState(r) === "CONFIRMED")
    .reduce((sum, r) => sum + r.price, 0);
  const outstanding = runs
    .filter((r) => paymentState(r) !== "CONFIRMED")
    .reduce((sum, r) => sum + r.price, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Your earnings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every errand you&apos;ve completed. Payments happen outside the app,
        this is your record of them.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Received" value={formatPrice(received)} hint="Confirmed by you" />
        <StatTile
          label="Still owed to you"
          value={formatPrice(outstanding)}
          hint="Completed, not yet confirmed"
        />
        <StatTile label="Completed runs" value={String(runs.length)} />
        <StatTile
          label="Rating"
          value={<StarRating value={rating.average} count={rating.count} size="md" />}
          hint="From posters, after each errand"
        />
      </div>

      {runs.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-medium">No completed runs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Finished errands and what you&apos;ve earned from them show up here.
          </p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {runs.map((run) => (
            <li
              key={run.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
            >
              <Link href={`/runner/tasks/${run.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium hover:underline">{run.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {categoryLabel(run.category)} · for {run.poster.name} ·{" "}
                  {RUNNER_LABEL[paymentState(run)]}
                </p>
              </Link>
              <p className="shrink-0 font-medium">{formatPrice(run.price)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
