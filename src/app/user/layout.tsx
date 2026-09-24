import { requireRole } from "@/lib/requireRole";
import { RoleShell } from "@/components/role-shell";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("USER");

  return (
    <RoleShell nav={[{ href: "/user/dashboard", label: "Errands" }, { href: "/user/history", label: "History" }]} role="USER" userName={session.user.name ?? session.user.email ?? ""}>
      {children}
    </RoleShell>
  );
}
