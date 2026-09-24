import { TaskStatus, type Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TaskStatusError } from "@/lib/taskStatus";
import { notify } from "@/lib/notifications";

// Once an errand is COMPLETED each side can rate the other: the poster
// rates the runner, the runner rates the poster, one rating each, comment
// optional. The unique index on (taskId, ratedById) is the real guarantee
// of "once", the checks here just give a readable message first.
export async function rateCounterpart(
  taskId: string,
  input: { score: number; comment?: string },
  actingUser: { id: string; role: Role },
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { ratings: { select: { ratedById: true } } },
  });
  if (!task) {
    throw new TaskStatusError("Task not found.");
  }

  const isPoster = task.posterId === actingUser.id;
  const isRunner = task.runnerId === actingUser.id;
  if (!isPoster && !isRunner) {
    throw new TaskStatusError("Only the poster or the runner can rate this errand.");
  }
  if (task.status !== TaskStatus.COMPLETED || !task.runnerId) {
    throw new TaskStatusError("You can rate once the errand is completed.");
  }
  if (task.ratings.some((r) => r.ratedById === actingUser.id)) {
    throw new TaskStatusError("You've already rated this errand.");
  }

  const rateeId = isPoster ? task.runnerId : task.posterId;
  try {
    const rating = await prisma.rating.create({
      data: {
        score: input.score,
        comment: input.comment || null,
        taskId,
        ratedById: actingUser.id,
        ratedUserId: rateeId,
      },
    });
    const rater = await prisma.user.findUnique({ where: { id: actingUser.id }, select: { name: true } });
    await notify(
      rateeId,
      `${rater?.name ?? "Someone"} rated you for "${task.title}"`,
      isPoster ? `/runner/tasks/${taskId}` : `/user/tasks/${taskId}`,
    );
    return rating;
  } catch (error) {
    // Two submits racing past the check above: the unique index catches it.
    if ((error as { code?: string }).code === "P2002") {
      throw new TaskStatusError("You've already rated this errand.");
    }
    throw error;
  }
}
