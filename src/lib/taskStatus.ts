import { BidStatus, TaskStatus, type Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notify, notifyMany } from "@/lib/notifications";
import { formatPrice } from "@/lib/formatPrice";

// The only file allowed to change Task.status (see plan §4 and CLAUDE.md):
// updateTaskStatus() for the ordinary lifecycle moves, and awardBid() for
// the one that has its own rules, a poster choosing a runner. Keeping every
// status write here is what makes "real-time tracking" trustworthy: there's
// exactly one set of rules to get right.

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
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { runner: { select: { name: true } } },
  });
  if (!task) {
    throw new TaskStatusError("Task not found.");
  }

  // Errands aren't taken first-come-first-served: runners bid and the
  // poster awards (awardBid below), so nobody can move a task to ACCEPTED
  // any other way.
  if (newStatus === TaskStatus.ACCEPTED) {
    throw new TaskStatusError("An errand is awarded by the poster, from the bids.");
  }

  if (!ALLOWED_TRANSITIONS[task.status].includes(newStatus)) {
    throw new TaskStatusError(
      `Cannot move a task from ${task.status} to ${newStatus}.`,
    );
  }

  // Who may make which transition. The plan's own two sections don't
  // fully agree here: §3 says the poster can only cancel while PENDING,
  // but the §4 diagram also allows CANCELLED from ACCEPTED. Resolved as:
  // the poster cancels before anyone is awarded the errand, and the
  // assigned runner can back out after being awarded but before starting.
  // Once IN_PROGRESS, cancelling is off the table for both.
  switch (newStatus) {
    case TaskStatus.IN_PROGRESS:
    case TaskStatus.COMPLETED: {
      if (task.runnerId !== actingUser.id) {
        throw new TaskStatusError("Only the assigned runner can update this task.");
      }
      // Bids don't need payout details, so this is where a bank transfer
      // errand starts needing them: before work begins, so the poster
      // always has somewhere to send the money. The start button collects
      // them inline, this is the check that can't be bypassed.
      if (newStatus === TaskStatus.IN_PROGRESS && task.paymentMethod === "BANK_TRANSFER") {
        const runner = await prisma.user.findUnique({
          where: { id: actingUser.id },
          select: { bankAccountNumber: true },
        });
        if (!runner?.bankAccountNumber) {
          throw new TaskStatusError(
            "Add your bank details before starting a bank transfer errand.",
          );
        }
      }
      break;
    }
    case TaskStatus.CANCELLED: {
      if (task.status === TaskStatus.PENDING && task.posterId !== actingUser.id) {
        throw new TaskStatusError("Only the poster can cancel a pending task.");
      }
      if (task.status === TaskStatus.ACCEPTED && task.runnerId !== actingUser.id) {
        throw new TaskStatusError("Only the assigned runner can cancel an accepted task.");
      }
      break;
    }
  }

  // updateMany + an explicit status check in the where clause guards
  // against a race: any transition firing twice concurrently. Whoever's
  // write lands second gets a stale-state error instead of silently
  // overwriting the first. A plain `update` can't express this because
  // Prisma's update where clause only accepts unique fields.
  const result = await prisma.task.updateMany({
    where: { id: taskId, status: task.status },
    data: { status: newStatus },
  });
  if (result.count === 0) {
    throw new TaskStatusError(
      "This task's status changed before your update went through. Refresh and try again.",
    );
  }

  const posterHref = `/user/tasks/${taskId}`;
  const runnerName = task.runner?.name ?? "The runner";
  if (newStatus === TaskStatus.CANCELLED && task.status === TaskStatus.ACCEPTED) {
    await notify(task.posterId, `${runnerName} backed out of "${task.title}"`, posterHref);
  } else if (newStatus === TaskStatus.CANCELLED) {
    // The poster cancelled while bids were still open: close them and tell
    // the bidders, so nobody is left waiting on an errand that's gone.
    const open = await prisma.bid.findMany({
      where: { taskId, status: BidStatus.OPEN },
      select: { runnerId: true },
    });
    await prisma.bid.updateMany({
      where: { taskId, status: BidStatus.OPEN },
      data: { status: BidStatus.NOT_AWARDED },
    });
    await notifyMany(
      open.map((b) => b.runnerId),
      `"${task.title}" was cancelled by the poster`,
      `/runner/tasks/${taskId}`,
    );
  } else if (newStatus === TaskStatus.IN_PROGRESS) {
    await notify(task.posterId, `${runnerName} started "${task.title}"`, posterHref);
  } else if (newStatus === TaskStatus.COMPLETED) {
    await notify(
      task.posterId,
      `${runnerName} finished "${task.title}". Rate them and mark it paid`,
      posterHref,
    );
  }

  return prisma.task.findUniqueOrThrow({ where: { id: taskId } });
}

// The poster picks a runner from the bids. This is the one PENDING ->
// ACCEPTED move: it assigns that runner at their bid price, marks the bid
// AWARDED and every other open bid NOT_AWARDED, all in one transaction so
// it's never half-done, then tells everyone. `expectedPrice` is the price
// the poster was looking at: if the runner changed their bid between page
// load and click, this refuses instead of awarding at a price never seen.
export async function awardBid(
  taskId: string,
  bidId: string,
  actingUser: ActingUser,
  expectedPrice: number,
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { bids: true },
  });
  if (!task) {
    throw new TaskStatusError("Task not found.");
  }
  if (task.posterId !== actingUser.id) {
    throw new TaskStatusError("Only the poster can award an errand.");
  }
  if (task.status !== TaskStatus.PENDING) {
    throw new TaskStatusError("This errand has already been awarded or closed.");
  }
  const bid = task.bids.find((b) => b.id === bidId);
  if (!bid || bid.status !== BidStatus.OPEN) {
    throw new TaskStatusError("That bid is no longer available.");
  }
  if (bid.price !== expectedPrice) {
    throw new TaskStatusError("The bid changed before you awarded it. Refresh to see the new price.");
  }

  await prisma.$transaction(async (tx) => {
    const assigned = await tx.task.updateMany({
      where: { id: taskId, status: TaskStatus.PENDING },
      data: { status: TaskStatus.ACCEPTED, runnerId: bid.runnerId, price: bid.price },
    });
    if (assigned.count === 0) {
      throw new TaskStatusError("This errand has already been awarded or closed.");
    }
    // Pinned to the price the poster saw, in case the runner re-bid.
    const won = await tx.bid.updateMany({
      where: { id: bid.id, status: BidStatus.OPEN, price: expectedPrice },
      data: { status: BidStatus.AWARDED, counterPrice: null },
    });
    if (won.count === 0) {
      throw new TaskStatusError("The bid changed before you awarded it. Refresh to see the new price.");
    }
    await tx.bid.updateMany({
      where: { taskId, status: BidStatus.OPEN, id: { not: bid.id } },
      data: { status: BidStatus.NOT_AWARDED },
    });
  });

  const runnerHref = `/runner/tasks/${taskId}`;
  await notify(bid.runnerId, `You were awarded "${task.title}" at ${formatPrice(bid.price)}`, runnerHref);
  await notifyMany(
    task.bids.filter((b) => b.id !== bid.id && b.status === BidStatus.OPEN).map((b) => b.runnerId),
    `"${task.title}" was awarded to another runner`,
    runnerHref,
  );

  return prisma.task.findUniqueOrThrow({ where: { id: taskId } });
}
