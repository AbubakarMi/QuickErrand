import { TaskStatus, type Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TaskStatusError } from "@/lib/taskStatus";
import { notify } from "@/lib/notifications";

// A two-step record, not a payment: after the errand is COMPLETED the
// poster pays the runner outside the app and marks it paid, then the
// runner confirms they received it. Nothing here moves or verifies money
// (see TASKS.md 3.6). Each step is a timestamp that can be set exactly
// once, in order.

type ActingUser = { id: string; role: Role };

export async function markTaskPaid(taskId: string, actingUser: ActingUser) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new TaskStatusError("Task not found.");
  }
  if (task.posterId !== actingUser.id) {
    throw new TaskStatusError("Only the poster can mark an errand as paid.");
  }
  if (task.status !== TaskStatus.COMPLETED) {
    throw new TaskStatusError("You can mark it paid once the errand is completed.");
  }
  if (task.paidAt) {
    throw new TaskStatusError("This errand is already marked as paid.");
  }

  const result = await prisma.task.updateMany({
    where: { id: taskId, status: TaskStatus.COMPLETED, paidAt: null },
    data: { paidAt: new Date() },
  });
  if (result.count === 0) {
    throw new TaskStatusError("This errand is already marked as paid.");
  }
  if (task.runnerId) {
    await notify(
      task.runnerId,
      `The poster marked "${task.title}" as paid. Confirm you received it`,
      `/runner/tasks/${taskId}`,
    );
  }

  return prisma.task.findUniqueOrThrow({ where: { id: taskId } });
}

export async function confirmPaymentReceived(
  taskId: string,
  actingUser: ActingUser,
) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new TaskStatusError("Task not found.");
  }
  if (task.runnerId !== actingUser.id) {
    throw new TaskStatusError("Only the assigned runner can confirm payment.");
  }
  if (!task.paidAt) {
    throw new TaskStatusError("The poster hasn't marked this errand as paid yet.");
  }
  if (task.paymentConfirmedAt) {
    throw new TaskStatusError("You've already confirmed this payment.");
  }

  const result = await prisma.task.updateMany({
    where: {
      id: taskId,
      runnerId: actingUser.id,
      paidAt: { not: null },
      paymentConfirmedAt: null,
    },
    data: { paymentConfirmedAt: new Date() },
  });
  if (result.count === 0) {
    throw new TaskStatusError("You've already confirmed this payment.");
  }
  await notify(
    task.posterId,
    `The runner confirmed they received payment for "${task.title}"`,
    `/user/tasks/${taskId}`,
  );

  return prisma.task.findUniqueOrThrow({ where: { id: taskId } });
}
