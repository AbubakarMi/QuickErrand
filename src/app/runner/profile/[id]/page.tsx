import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileView } from "@/components/profile-view";

// A runner can open posters' profiles (to judge who they're working for)
// and their own.
export default async function RunnerAreaProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (id !== session!.user.id) {
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (target?.role !== "USER") notFound();
  }
  return <ProfileView userId={id} />;
}
