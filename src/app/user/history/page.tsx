import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/formatPrice";
import { paymentState, type PaymentState } from "@/lib/paymentState";
import { StatTile } from "@/components/stat-tile";
import { StatusBadge } from "@/components/status-badge";

const POSTER_LABEL: Record<PaymentState, string> = {
  UNPAID: "Not marked paid yet",
  PAID: "Marked paid, runner hasn't confirmed",
  CONFIRMED: "Paid, runner confirmed",
};

export default async function UserHistoryPage() {
  const session = await getServerSession(authOptions);
  const errands = await prisma.task.findMany({
    where: { posterId: session!.user.id, status: { in: ["COMPLETED", "CANCELLED"] } },
    orderBy: { updatedAt: "desc" },
    include: { runner: { select: { name: true } } },
  });

  const completed = errands.filter((e) => e.status === "COMPLETED");
  const spent = completed
    .filter((e) => e.paidAt)
    .reduce((sum, e) => sum + e.price, 0);
  const toPay = completed
    .filter((e) => !e.paidAt)
    .reduce((sum, e) => sum + e.price, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Your history</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Finished and cancelled errands, and what you&apos;ve spent. Payments
        happen outside the app, this is your record of them.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Spent" value={formatPrice(spent)} hint="Marked as paid" />
        <StatTile
          label="Still to pay"
          value={formatPrice(toPay)}
          hint="Completed, not marked paid"
        />
        <StatTile label="Completed errands" value={String(completed.length)} />
      </div>

      {errands.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-medium">Nothing finished yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Completed and cancelled errands land here.
          </p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {errands.map((errand) => (
            <li
              key={errand.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
            >
              <Link href={`/user/tasks/${errand.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium hover:underline">{errand.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {categoryLabel(errand.category)}
                  {errand.runner ? ` · ${errand.runner.name}` : ""}
                  {errand.status === "COMPLETED"
                    ? ` · ${POSTER_LABEL[paymentState(errand)]}`
                    : ""}
                </p>
              </Link>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={errand.status} />
                <p className="w-16 text-right font-medium">
                  {formatPrice(errand.price)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
