import { TaskStatus, type Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// The only function in the codebase allowed to change Task.status. Every
// route or action that moves a task through its lifecycle calls this
// instead of touching prisma.task.update directly (see plan §4 and
// CLAUDE.md). Keeping it in one place is what makes "real-time tracking"
// actually trustworthy: there's exactly one set of rules to get right.

const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: [TaskStatus.ACCEPTED, TaskStatus.CANCELLED],
  ACCEPTED: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  IN_PROGRESS: [TaskStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
};

export class TaskStatusError extends Error {}

type ActingUser = { id: string; role: Role };

export async function updateTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
  actingUser: ActingUser,
) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new TaskStatusError("Task not found.");
  }

  if (!ALLOWED_TRANSITIONS[task.status].includes(newStatus)) {
    throw new TaskStatusError(
      `Cannot move a task from ${task.status} to ${newStatus}.`,
    );
  }

  // Who may make which transition. The plan's own two sections don't
  // fully agree here: §3 says the poster can only cancel while PENDING,
  // but the §4 diagram also allows CANCELLED from ACCEPTED. Resolved as:
  // the poster cancels before anyone takes the task, and the assigned
  // runner can back out after accepting but before starting it. Once
  // IN_PROGRESS, cancelling is off the table for both, only completion
  // moves it forward from there.
  switch (newStatus) {
    case TaskStatus.ACCEPTED: {
      if (actingUser.role !== "RUNNER") {
        throw new TaskStatusError("Only a runner can accept a task.");
      }
      break;
    }
    case TaskStatus.IN_PROGRESS:
    case TaskStatus.COMPLETED: {
      if (task.runnerId !== actingUser.id) {
        throw new TaskStatusError(
          "Only the assigned runner can update this task.",
        );
      }
      break;
    }
    case TaskStatus.CANCELLED: {
      if (task.status === TaskStatus.PENDING && task.posterId !== actingUser.id) {
        throw new TaskStatusError("Only the poster can cancel a pending task.");
      }
      if (
        task.status === TaskStatus.ACCEPTED &&
        task.runnerId !== actingUser.id
      ) {
        throw new TaskStatusError(
          "Only the assigned runner can cancel an accepted task.",
        );
      }
      break;
    }
  }

  // updateMany + an explicit status check in the where clause guards
  // against a race: two runners accepting the same PENDING task at once,
  // or any transition firing twice concurrently. Whoever's write lands
  // second gets a stale-state error instead of silently overwriting the
  // first. A plain `update` can't express this because Prisma's update
  // where clause only accepts unique fields, not an arbitrary filter.
  const result = await prisma.task.updateMany({
    where: { id: taskId, status: task.status },
    data: {
      status: newStatus,
      ...(newStatus === TaskStatus.ACCEPTED ? { runnerId: actingUser.id } : {}),
    },
  });

  if (result.count === 0) {
    throw new TaskStatusError(
      "This task's status changed before your update went through. Refresh and try again.",
    );
  }

  return prisma.task.findUniqueOrThrow({ where: { id: taskId } });
}
