import Link from "next/link";
import type { Role } from "@prisma/client";
import { SignOutButton } from "@/components/sign-out-button";
import { NotificationBell } from "@/components/notification-bell";

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
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <Link
          href="/"
          className="font-heading text-lg font-semibold tracking-tight"
        >
          Quick<span className="text-primary">Errand</span>
        </Link>
        <nav className="ml-6 mr-auto flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {role !== "ADMIN" && <NotificationBell />}
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {userName}
          </span>
          <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
            {ROLE_LABEL[role]}
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
