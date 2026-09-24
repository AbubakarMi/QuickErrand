import { requireRole } from "@/lib/requireRole";
import { RoleShell } from "@/components/role-shell";

export default async function RunnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("RUNNER");

  return (
    <RoleShell nav={[{ href: "/runner/dashboard", label: "Find errands" }, { href: "/runner/earnings", label: "Earnings" }]} role="RUNNER" userName={session.user.name ?? session.user.email ?? ""}>
      {children}
    </RoleShell>
  );
}
