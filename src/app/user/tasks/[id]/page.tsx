import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserTaskDetailView } from "./task-detail-view";

export default async function UserTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      negotiatedByRunner: { select: { name: true } },
      runner: {
        select: {
          name: true,
          phone: true,
          bankAccountNumber: true,
          bankName: true,
        },
      },
    },
  });

  if (!task || task.posterId !== session!.user.id) {
    notFound();
  }

  // Same rule as GET /api/tasks/:id: a cancelled errand keeps no contact
  // or payout details for the runner.
  const initialTask =
    task.status === "CANCELLED" && task.runner
      ? {
          ...task,
          runner: {
            ...task.runner,
            phone: null,
            bankAccountNumber: null,
            bankName: null,
          },
        }
      : task;

  return <UserTaskDetailView initialTask={initialTask} />;
}
