import { requireRole } from "@/lib/requireRole";
import { RoleShell } from "@/components/role-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("ADMIN");

  return (
    <RoleShell role="ADMIN" userName={session.user.name ?? session.user.email ?? ""}>
      {children}
    </RoleShell>
  );
}
