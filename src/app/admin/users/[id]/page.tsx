import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileView } from "@/components/profile-view";
import { DeactivateUserButton } from "@/components/deactivate-user-button";
import { StatTile } from "@/components/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { TimeAgo } from "@/components/time-ago";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/formatPrice";
import { paymentState } from "@/lib/paymentState";

const RECENT_LIMIT = 30;

// The admin's view of one user: their public profile (reused as-is,
// ProfileView never shows contact or payout details to a viewer who isn't
// the account itself, and admin never is), plus the two things a
// moderator actually needs that the public profile doesn't show, a money
// total and every errand this account has touched.
export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, role: true, isActive: true },
  });
  if (!user || user.role === "ADMIN") notFound();

  const isRunner = user.role === "RUNNER";
  const tasks = await prisma.task.findMany({
    where: isRunner ? { runnerId: id } : { posterId: id },
    orderBy: { createdAt: "desc" },
    take: RECENT_LIMIT,
    include: {
      poster: { select: { name: true } },
      runner: { select: { name: true } },
    },
  });

  const completed = tasks.filter((t) => t.status === "COMPLETED");
  // Runner: what's actually been confirmed received. Poster: what they've
  // confirmed paying out. Either way, a record of money, not a balance
  // the platform holds, see CLAUDE.md.
  const moneyTotal = completed
    .filter((t) => paymentState(t) === "CONFIRMED")
    .reduce((sum, t) => sum + t.price, 0);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to users
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Account status</p>
          <p className="mt-0.5 text-sm font-medium">
            {user.isActive ? "Active" : "Deactivated"}
          </p>
        </div>
        <DeactivateUserButton userId={user.id} isActive={user.isActive} />
      </div>

      <div className="mt-6">
        <ProfileView userId={id} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile
          label={isRunner ? "Confirmed earnings" : "Confirmed spend"}
          value={formatPrice(moneyTotal)}
          hint="Marked paid and confirmed by both sides"
        />
        <StatTile label="Completed errands" value={String(completed.length)} />
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {isRunner ? "Errands run" : "Errands posted"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Most recent {RECENT_LIMIT}, all statuses.
        </p>
        {tasks.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">Nothing posted or run yet.</p>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/admin/tasks/${task.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{task.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {categoryLabel(task.category)} ·{" "}
                      {isRunner ? task.poster.name : (task.runner?.name ?? "No runner yet")} ·{" "}
                      <TimeAgo date={task.createdAt} prefix="Posted " />
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={task.status} />
                    <p className="w-16 text-right font-medium">{formatPrice(task.price)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
