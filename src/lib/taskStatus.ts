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

// The price a given runner gets if they accept right now. Normally the
// asking price. But if the poster agreed to this runner's offer (errand
// reserved for them), or countered this runner's offer and this accept is
// the runner taking that counter, it's the negotiated price.
function priceFor(
  task: {
    price: number;
    negotiatedPrice: number | null;
    negotiatedByRunnerId: string | null;
    offerBy: "RUNNER" | "POSTER" | null;
    offerAgreedAt: Date | null;
  },
  runnerId: string,
) {
  const isTheNegotiator = task.negotiatedByRunnerId === runnerId;
  const onTheTable =
    isTheNegotiator &&
    (task.offerAgreedAt !== null || task.offerBy === "POSTER");
  return onTheTable && task.negotiatedPrice !== null
    ? task.negotiatedPrice
    : task.price;
}

type ActingUser = { id: string; role: Role };

export async function updateTaskStatus(
  taskId: string,
  newStatus: TaskStatus,
  actingUser: ActingUser,
  // For ACCEPTED: the price the runner was looking at when they clicked.
  // Refused on mismatch, since the terms can change between page load and
  // click (a poster withdrawing an agreed offer, say).
  options: { expectedPrice?: number } = {},
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
      // Once the poster has agreed to a runner's offer, the errand is
      // reserved for that runner and this accept is them confirming it.
      const isReserved = task.offerAgreedAt !== null;
      if (isReserved && task.negotiatedByRunnerId !== actingUser.id) {
        throw new TaskStatusError("This errand is reserved for another runner.");
      }
      const termsPrice = priceFor(task, actingUser.id);
      if (
        options.expectedPrice !== undefined &&
        options.expectedPrice !== termsPrice
      ) {
        throw new TaskStatusError(
          "The price changed before you accepted. Refresh to see the new terms.",
        );
      }
      // The accept button collects payout details inline, but that's UI
      // only. A hand-built request would otherwise assign a runner the
      // poster has nowhere to send money to.
      if (task.paymentMethod === "BANK_TRANSFER") {
        const runner = await prisma.user.findUnique({
          where: { id: actingUser.id },
          select: { bankAccountNumber: true },
        });
        if (!runner?.bankAccountNumber) {
          throw new TaskStatusError(
            "Add your bank details before accepting a bank transfer errand.",
          );
        }
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
    where: {
      id: taskId,
      status: task.status,
      // Pin the negotiation state we validated against, so a poster
      // withdrawing or changing the deal mid-request fails this instead
      // of assigning at terms that no longer exist.
      negotiatedPrice: task.negotiatedPrice,
      negotiatedByRunnerId: task.negotiatedByRunnerId,
      offerAgreedAt: task.offerAgreedAt,
      offerBy: task.offerBy,
    },
    data: {
      status: newStatus,
      // An accept locks in the terms: an agreed offer's price becomes the
      // price, while a plain accept at the asking price supersedes any
      // unagreed counter-offer sitting on the task, whoever made it.
      ...(newStatus === TaskStatus.ACCEPTED
        ? {
            runnerId: actingUser.id,
            price: priceFor(task, actingUser.id),
            negotiatedPrice: null,
            negotiatedByRunnerId: null,
            offerBy: null,
            offerAgreedAt: null,
          }
        : {}),
    },
  });

  if (result.count === 0) {
    throw new TaskStatusError(
      "This task's status changed before your update went through. Refresh and try again.",
    );
  }

  return prisma.task.findUniqueOrThrow({ where: { id: taskId } });
}
