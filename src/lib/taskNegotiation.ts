import { TaskStatus, type Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TaskStatusError } from "@/lib/taskStatus";

// Negotiation is a back-and-forth on a PENDING task, one price on the table
// at a time, `offerBy` saying who put it there (TASKS.md 3.9, 3.16):
//
//   runner offers P  ->  poster agrees  ->  runner confirms (a plain accept)
//                    \-> poster counters Q -> runner accepts Q (a plain
//                    |                        accept, priced by taskStatus)
//                    |                     \-> runner counters again ...
//                    \-> poster declines
//
// Making or answering an offer needs no bank details, nobody has committed.
// The runner's accept is the commitment, and that's where bank details are
// required. Nothing here writes Task.status.

type ActingUser = { id: string; role: Role };

const CLEAR_NEGOTIATION = {
  negotiatedPrice: null,
  negotiatedByRunnerId: null,
  offerBy: null,
  offerAgreedAt: null,
} as const;

// A runner puts a price on the table: a first offer, or a counter to the
// poster's counter.
export async function proposeCounterOffer(
  taskId: string,
  price: number,
  actingUser: ActingUser,
) {
  if (actingUser.role !== "RUNNER") {
    throw new TaskStatusError("Only a runner can make an offer.");
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new TaskStatusError("Task not found.");
  }
  if (task.status !== TaskStatus.PENDING) {
    throw new TaskStatusError("This errand is no longer open for offers.");
  }
  if (task.offerAgreedAt) {
    throw new TaskStatusError("The poster has already agreed a price with a runner.");
  }
  // The poster's counter is aimed at one runner. Others can still accept
  // at the asking price, which supersedes it, but can't cut in with offers.
  if (task.offerBy === "POSTER" && task.negotiatedByRunnerId !== actingUser.id) {
    throw new TaskStatusError("The poster is negotiating with another runner.");
  }
  if (price === task.price) {
    throw new TaskStatusError(
      "That's the asking price already. Just accept the errand instead.",
    );
  }
  if (task.offerBy === "POSTER" && price === task.negotiatedPrice) {
    throw new TaskStatusError(
      "That's the poster's counter already. Just accept it instead.",
    );
  }

  const result = await prisma.task.updateMany({
    where: {
      id: taskId,
      status: TaskStatus.PENDING,
      offerAgreedAt: null,
      negotiatedPrice: task.negotiatedPrice,
      negotiatedByRunnerId: task.negotiatedByRunnerId,
    },
    data: {
      negotiatedPrice: price,
      negotiatedByRunnerId: actingUser.id,
      offerBy: "RUNNER",
    },
  });
  if (result.count === 0) {
    throw new TaskStatusError("The negotiation changed. Refresh and try again.");
  }

  return prisma.task.findUniqueOrThrow({ where: { id: taskId } });
}

// The poster answers a runner's offer with a different price. Needs a
// runner's offer to be on the table, the poster doesn't cold-call runners.
export async function counterOfferAsPoster(
  taskId: string,
  price: number,
  actingUser: ActingUser,
) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new TaskStatusError("Task not found.");
  }
  if (task.posterId !== actingUser.id) {
    throw new TaskStatusError("Only the poster can counter an offer.");
  }
  if (
    task.status !== TaskStatus.PENDING ||
    task.negotiatedPrice === null ||
    task.negotiatedByRunnerId === null
  ) {
    throw new TaskStatusError("There is no offer to counter.");
  }
  if (task.offerAgreedAt) {
    throw new TaskStatusError("You've already agreed a price. Take it back first.");
  }
  if (task.offerBy === "POSTER") {
    throw new TaskStatusError("You're already waiting on the runner's reply.");
  }
  if (price === task.negotiatedPrice) {
    throw new TaskStatusError("That's their offer already. Just agree to it.");
  }

  const result = await prisma.task.updateMany({
    where: {
      id: taskId,
      status: TaskStatus.PENDING,
      offerAgreedAt: null,
      offerBy: "RUNNER",
      negotiatedPrice: task.negotiatedPrice,
      negotiatedByRunnerId: task.negotiatedByRunnerId,
    },
    data: { negotiatedPrice: price, offerBy: "POSTER" },
  });
  if (result.count === 0) {
    throw new TaskStatusError(
      "The offer changed before your response went through. Refresh and try again.",
    );
  }

  return prisma.task.findUniqueOrThrow({ where: { id: taskId } });
}

// The poster agrees to the runner's offer on the table. `expectedPrice` is
// the price they were looking at, and the where clause pins the exact
// offer, so a runner swapping in a different one between page load and
// click makes this fail instead of agreeing to terms the poster never saw.
// (The runner agreeing to a poster's counter is just their accept.)
export async function agreeToCounterOffer(
  taskId: string,
  actingUser: ActingUser,
  expectedPrice: number,
) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new TaskStatusError("Task not found.");
  }
  if (task.posterId !== actingUser.id) {
    throw new TaskStatusError("Only the poster can agree to an offer.");
  }
  if (
    task.status !== TaskStatus.PENDING ||
    task.negotiatedPrice === null ||
    task.negotiatedByRunnerId === null ||
    task.offerBy !== "RUNNER" ||
    task.offerAgreedAt
  ) {
    throw new TaskStatusError("There is no open offer to agree to.");
  }
  if (task.negotiatedPrice !== expectedPrice) {
    throw new TaskStatusError(
      "The offer changed before your response went through. Refresh and try again.",
    );
  }

  const result = await prisma.task.updateMany({
    where: {
      id: taskId,
      status: TaskStatus.PENDING,
      negotiatedPrice: task.negotiatedPrice,
      negotiatedByRunnerId: task.negotiatedByRunnerId,
      offerBy: "RUNNER",
      offerAgreedAt: null,
    },
    data: { offerAgreedAt: new Date() },
  });
  if (result.count === 0) {
    throw new TaskStatusError(
      "The offer changed before your response went through. Refresh and try again.",
    );
  }

  return prisma.task.findUniqueOrThrow({ where: { id: taskId } });
}

// The poster ends the negotiation: turning down an offer, withdrawing their
// own counter, or taking back a price they'd agreed. Back to the open pool
// at the asking price.
export async function declineCounterOffer(taskId: string, actingUser: ActingUser) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new TaskStatusError("Task not found.");
  }
  if (task.posterId !== actingUser.id) {
    throw new TaskStatusError("Only the poster can decline an offer.");
  }
  if (task.status !== TaskStatus.PENDING || task.negotiatedPrice === null) {
    throw new TaskStatusError("There is no open offer on this errand.");
  }

  await prisma.task.updateMany({
    where: { id: taskId, status: TaskStatus.PENDING },
    data: CLEAR_NEGOTIATION,
  });

  return prisma.task.findUniqueOrThrow({ where: { id: taskId } });
}

// The runner ends the negotiation from their side: taking back their offer,
// turning down the poster's counter, or letting go of a reserved errand.
export async function withdrawCounterOffer(taskId: string, actingUser: ActingUser) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new TaskStatusError("Task not found.");
  }
  if (
    task.status !== TaskStatus.PENDING ||
    task.negotiatedByRunnerId !== actingUser.id
  ) {
    throw new TaskStatusError("You have no open offer on this errand.");
  }

  await prisma.task.updateMany({
    where: {
      id: taskId,
      status: TaskStatus.PENDING,
      negotiatedByRunnerId: actingUser.id,
    },
    data: CLEAR_NEGOTIATION,
  });

  return prisma.task.findUniqueOrThrow({ where: { id: taskId } });
}
