import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RoleShell } from "@/components/role-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/post-login");

  return (
    <RoleShell role="ADMIN" userName={session.user.name ?? session.user.email ?? ""}>
      {children}
    </RoleShell>
  );
}
