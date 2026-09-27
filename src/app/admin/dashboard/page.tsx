import { prisma } from "@/lib/prisma";
import { StatTile } from "@/components/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { TimeAgo } from "@/components/time-ago";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/formatPrice";

const RECENT_LIMIT = 50;

const ROLE_LABEL: Record<string, string> = {
  USER: "Requester",
  RUNNER: "Runner",
};

// Read-only, on purpose: this is a moderation view, not a CRUD panel.
// Nothing here writes to the database (see TASKS.md 4.1, 4.2 is the
// stretch goal that would change that).
export default async function AdminDashboardPage() {
  const [userCounts, taskCounts, users, tasks] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.task.groupBy({ by: ["status"], _count: true }),
    prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: { id: true, name: true, email: true, role: true, category: true, createdAt: true },
    }),
    prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      include: {
        poster: { select: { name: true } },
        runner: { select: { name: true } },
      },
    }),
  ]);

  const posterCount = userCounts.find((r) => r.role === "USER")?._count ?? 0;
  const runnerCount = userCounts.find((r) => r.role === "RUNNER")?._count ?? 0;
  const activeCount = taskCounts
    .filter((r) => r.status === "PENDING" || r.status === "ACCEPTED" || r.status === "IN_PROGRESS")
    .reduce((sum, r) => sum + r._count, 0);
  const completedCount = taskCounts.find((r) => r.status === "COMPLETED")?._count ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Everyone on the platform and every errand posted, read-only.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Posters" value={String(posterCount)} />
        <StatTile label="Runners" value={String(runnerCount)} />
        <StatTile label="Active errands" value={String(activeCount)} />
        <StatTile label="Completed" value={String(completedCount)} />
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-semibold tracking-tight">Users</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Most recently joined first, {RECENT_LIMIT} at a time.
        </p>
        {users.length === 0 ? (
          <EmptyState message="No one has signed up yet." />
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary text-xs text-muted-foreground">
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Joined</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <Td className="font-medium">{user.name}</Td>
                    <Td className="text-muted-foreground">{user.email}</Td>
                    <Td>
                      {ROLE_LABEL[user.role] ?? user.role}
                      {user.category ? ` · ${categoryLabel(user.category)}` : ""}
                    </Td>
                    <Td className="text-muted-foreground">
                      <TimeAgo date={user.createdAt} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-semibold tracking-tight">Errands</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Most recently posted first, {RECENT_LIMIT} at a time.
        </p>
        {tasks.length === 0 ? (
          <EmptyState message="No errands have been posted yet." />
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary text-xs text-muted-foreground">
                  <Th>Title</Th>
                  <Th>Poster</Th>
                  <Th>Runner</Th>
                  <Th>Price</Th>
                  <Th>Status</Th>
                  <Th>Posted</Th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-border last:border-0">
                    <Td className="max-w-56 truncate font-medium">{task.title}</Td>
                    <Td className="text-muted-foreground">{task.poster?.name ?? "—"}</Td>
                    <Td className="text-muted-foreground">{task.runner?.name ?? "—"}</Td>
                    <Td>{formatPrice(task.price)}</Td>
                    <Td>
                      <StatusBadge status={task.status} />
                    </Td>
                    <Td className="text-muted-foreground">
                      <TimeAgo date={task.createdAt} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 font-medium">{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ""}`}>{children}</td>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
