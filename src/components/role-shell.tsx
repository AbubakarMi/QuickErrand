import Link from "next/link";
import type { Role } from "@prisma/client";
import { SignOutButton } from "@/components/sign-out-button";
import { NotificationBell } from "@/components/notification-bell";
import { RoleNav } from "@/components/role-nav";

const ROLE_LABEL: Record<Role, string> = {
  USER: "Requester",
  RUNNER: "Runner",
  ADMIN: "Admin",
};

// Shared chrome for the three authenticated areas (user/runner/admin).
// Each role's layout.tsx does its own session/role check and wraps its
// children in this. The nav itself doesn't know or care which role it's
// rendering for beyond the label.
export function RoleShell({
  role,
  userName,
  nav = [],
  children,
}: {
  role: Role;
  userName: string;
  nav?: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex flex-wrap items-center gap-x-2 border-b border-border px-4 pt-3 sm:px-10 sm:py-4">
        <Link
          href="/"
          className="pb-2 font-heading text-lg font-semibold tracking-tight sm:pb-0"
        >
          Quick<span className="text-primary">Errand</span>
        </Link>
        <RoleNav items={nav} />
        <div className="ml-auto flex items-center gap-1 pb-2 sm:gap-3 sm:pb-0">
          {role !== "ADMIN" && <NotificationBell />}
          <span className="hidden max-w-40 truncate text-sm text-muted-foreground md:inline">
            {userName}
          </span>
          <span className="hidden rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground sm:inline">
            {ROLE_LABEL[role]}
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-10 sm:py-8">{children}</main>
    </div>
  );
}
