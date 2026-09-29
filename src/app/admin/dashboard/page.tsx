import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { StatTile } from "@/components/stat-tile";
import { STATUS_CONFIG } from "@/components/status-badge";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";
import { TrendBarChart } from "@/components/charts/trend-bar-chart";
import { CATEGORIES } from "@/lib/categories";
import { formatPrice } from "@/lib/formatPrice";
import { bucketByDay } from "@/lib/dailyBuckets";

const TREND_DAYS = 14;
const STATUS_ORDER: TaskStatus[] = ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

// The platform at a glance: numbers, then the same numbers shaped into
// something you can actually read a trend out of. Users and Errands moved
// to their own tabs (see admin/layout.tsx), this page stayed a swamp of
// two full tables until then. Still read-only.
export default async function AdminDashboardPage() {
  const trendSince = new Date();
  trendSince.setUTCDate(trendSince.getUTCDate() - (TREND_DAYS - 1));
  trendSince.setUTCHours(0, 0, 0, 0);

  const [
    userCounts,
    taskCounts,
    categoryCounts,
    completedValue,
    bidCount,
    recentTasks,
    recentUsers,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.task.groupBy({ by: ["status"], _count: true }),
    prisma.task.groupBy({ by: ["category"], _count: true }),
    prisma.task.aggregate({ where: { status: "COMPLETED" }, _sum: { price: true } }),
    prisma.bid.count(),
    prisma.task.findMany({ where: { createdAt: { gte: trendSince } }, select: { createdAt: true } }),
    prisma.user.findMany({
      where: { role: { not: "ADMIN" }, createdAt: { gte: trendSince } },
      select: { createdAt: true },
    }),
  ]);

  const posterCount = userCounts.find((r) => r.role === "USER")?._count ?? 0;
  const runnerCount = userCounts.find((r) => r.role === "RUNNER")?._count ?? 0;
  const activeCount = taskCounts
    .filter((r) => r.status === "PENDING" || r.status === "ACCEPTED" || r.status === "IN_PROGRESS")
    .reduce((sum, r) => sum + r._count, 0);
  const completedCount = taskCounts.find((r) => r.status === "COMPLETED")?._count ?? 0;

  const statusData = STATUS_ORDER.map((status) => ({
    label: STATUS_CONFIG[status].label,
    value: taskCounts.find((r) => r.status === status)?._count ?? 0,
    color: `var(${STATUS_CONFIG[status].colorVar})`,
  }));

  const categoryData = CATEGORIES.map((c) => ({
    label: c.label,
    value: categoryCounts.find((r) => r.category === c.value)?._count ?? 0,
  }))
    .sort((a, b) => b.value - a.value)
    .filter((c, i) => c.value > 0 || i < 3); // always show the top few, even at zero, so the chart isn't just one bar early on

  const postedTrend = bucketByDay(recentTasks.map((t) => t.createdAt), TREND_DAYS);
  const signupTrend = bucketByDay(recentUsers.map((u) => u.createdAt), TREND_DAYS);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The platform at a glance. Open the Users or Errands tab for the full lists.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Posters" value={String(posterCount)} />
        <StatTile label="Runners" value={String(runnerCount)} />
        <StatTile label="Active errands" value={String(activeCount)} />
        <StatTile label="Completed" value={String(completedCount)} />
        <StatTile label="Bids placed" value={String(bidCount)} />
        <StatTile label="Completed value" value={formatPrice(completedValue._sum.price ?? 0)} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Errands by status" subtitle="Where every posted errand stands right now">
          <HorizontalBarChart data={statusData} />
        </ChartCard>

        <ChartCard title="Errands by category" subtitle="What people are actually posting for">
          <HorizontalBarChart data={categoryData} color="var(--primary)" />
        </ChartCard>

        <ChartCard title="Errands posted" subtitle={`Last ${TREND_DAYS} days`}>
          <TrendBarChart data={postedTrend} color="var(--primary)" />
        </ChartCard>

        <ChartCard title="New accounts" subtitle={`Posters and runners, last ${TREND_DAYS} days`}>
          <TrendBarChart data={signupTrend} color="var(--brand-coral)" />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <h2 className="font-heading text-sm font-semibold tracking-tight">{title}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
