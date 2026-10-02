import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TimeAgo } from "@/components/time-ago";
import { DeactivateUserButton } from "@/components/deactivate-user-button";
import { PaginationLinks } from "@/components/pagination-links";
import { AdminSearchBox } from "@/components/admin-search-box";
import { categoryLabel } from "@/lib/categories";

const PAGE_SIZE = 25;

const ROLE_LABEL: Record<string, string> = {
  USER: "Requester",
  RUNNER: "Runner",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const requested = Number(pageParam);
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1;
  const query = q?.trim();

  const where = {
    role: { not: "ADMIN" as const },
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, name: true, email: true, role: true, category: true, createdAt: true, isActive: true },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {query
              ? `${total} match${total === 1 ? "" : "es"} for "${query}".`
              : `Every poster and runner, most recently joined first, ${total} in all.`}{" "}
            Open one for their full profile and history.
          </p>
        </div>
        <AdminSearchBox basePath="/admin/users" placeholder="Search by name or email" />
      </div>

      {users.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {total === 0 && !query
              ? "No one has signed up yet."
              : query
                ? `No one matches "${query}".`
                : "No users on this page."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-xs text-muted-foreground">
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <Td className="font-medium">
                    <Link href={`/admin/users/${user.id}`} className="hover:underline">
                      {user.name}
                    </Link>
                  </Td>
                  <Td className="text-muted-foreground">{user.email}</Td>
                  <Td>
                    {ROLE_LABEL[user.role] ?? user.role}
                    {user.category ? ` · ${categoryLabel(user.category)}` : ""}
                  </Td>
                  <Td className="text-muted-foreground">
                    <TimeAgo date={user.createdAt} />
                  </Td>
                  <Td>
                    <span
                      className={
                        user.isActive
                          ? "rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                          : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground line-through"
                      }
                    >
                      {user.isActive ? "Active" : "Deactivated"}
                    </span>
                  </Td>
                  <Td>
                    <DeactivateUserButton userId={user.id} isActive={user.isActive} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationLinks basePath="/admin/users" page={page} totalPages={totalPages} />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 font-medium">{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ""}`}>{children}</td>;
}
