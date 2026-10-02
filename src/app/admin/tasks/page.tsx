import Link from "next/link";
import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { TimeAgo } from "@/components/time-ago";
import { PaginationLinks } from "@/components/pagination-links";
import { AdminSearchBox } from "@/components/admin-search-box";
import { AdminStatusFilter } from "@/components/admin-status-filter";
import { formatPrice } from "@/lib/formatPrice";

const PAGE_SIZE = 25;

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const { page: pageParam, q, status: statusParam } = await searchParams;
  const requested = Number(pageParam);
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1;
  const query = q?.trim();
  const status = statusParam && statusParam in TaskStatus ? (statusParam as TaskStatus) : undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { poster: { name: { contains: query, mode: "insensitive" as const } } },
            { runner: { name: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        poster: { select: { name: true } },
        runner: { select: { name: true } },
        _count: { select: { bids: true } },
      },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(query || status);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Errands</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered
              ? `${total} match${total === 1 ? "" : "es"}.`
              : `Every errand posted, most recent first, ${total} in all.`}{" "}
            Open one for its full detail, including every bid it received.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminSearchBox basePath="/admin/tasks" placeholder="Search title, poster, or runner" />
          <AdminStatusFilter basePath="/admin/tasks" />
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {total === 0 && !filtered
              ? "No errands have been posted yet."
              : filtered
                ? "Nothing matches that search."
                : "No errands on this page."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-xs text-muted-foreground">
                <Th>Title</Th>
                <Th>Poster</Th>
                <Th>Runner</Th>
                <Th>Price</Th>
                <Th>Bids</Th>
                <Th>Status</Th>
                <Th>Posted</Th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-border last:border-0">
                  <Td className="max-w-56 truncate font-medium">
                    <Link href={`/admin/tasks/${task.id}`} className="hover:underline">
                      {task.title}
                    </Link>
                  </Td>
                  <Td className="text-muted-foreground">{task.poster?.name ?? "—"}</Td>
                  <Td className="text-muted-foreground">{task.runner?.name ?? "—"}</Td>
                  <Td>{formatPrice(task.price)}</Td>
                  <Td className="text-muted-foreground">{task._count.bids}</Td>
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

      <PaginationLinks basePath="/admin/tasks" page={page} totalPages={totalPages} />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 font-medium">{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ""}`}>{children}</td>;
}
