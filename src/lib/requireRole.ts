import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// The guard every role layout runs: signed in, the right role, and a user
// that still exists and is still active. The existence check matters
// because a session cookie outlives its user (a wiped database, a deleted
// account), and since signed-in users are kept off the guest pages, a dead
// session would otherwise be a trap: dashboard crashes, no way out. Both
// cases get sent to /signed-out, which actually clears the session, an
// admin deactivating someone mid-session takes effect on their very next
// request, not just their next login.
export async function requireRole(role: Role) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== role) redirect("/post-login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isActive: true },
  });
  if (!user || !user.isActive) redirect("/signed-out");

  return session;
}
