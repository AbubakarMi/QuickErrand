import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RoleShell } from "@/components/role-shell";

export default async function RunnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "RUNNER") redirect("/post-login");

  return (
    <RoleShell role="RUNNER" userName={session.user.name ?? session.user.email ?? ""}>
      {children}
    </RoleShell>
  );
}
