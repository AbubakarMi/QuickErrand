import { BidStatus, TaskStatus, type Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TaskStatusError } from "@/lib/taskStatus";
import { notify } from "@/lib/notifications";
import { formatPrice } from "@/lib/formatPrice";

// Bidding on an errand (TASKS.md 3.19). Any number of runners can bid, one
// live bid each, and the poster picks one (awardBid in taskStatus.ts, since
// that writes status). Nothing in this file does. No bank details are asked
// for here: bidding is just a price, payout details are needed once the
// runner starts the job.

type ActingUser = { id: string; role: Role };

async function openTask(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new TaskStatusError("Task not found.");
  }
  if (task.status !== TaskStatus.PENDING) {
    throw new TaskStatusError("This errand is no longer taking bids.");
  }
  return task;
}

// Place a bid, or change the one you already have (which also withdraws
// any counter the poster made to the old price).
export async function placeBid(taskId: string, price: number, actingUser: ActingUser) {
  if (actingUser.role !== "RUNNER") {
    throw new TaskStatusError("Only a runner can bid on an errand.");
  }
  const task = await openTask(taskId);

  const existing = await prisma.bid.findUnique({
    where: { taskId_runnerId: { taskId, runnerId: actingUser.id } },
  });
  const bid = await prisma.bid.upsert({
    where: { taskId_runnerId: { taskId, runnerId: actingUser.id } },
    create: { taskId, runnerId: actingUser.id, price },
    update: { price, counterPrice: null, status: BidStatus.OPEN },
  });

  const runner = await prisma.user.findUnique({
    where: { id: actingUser.id },
    select: { name: true },
  });
  await notify(
    task.posterId,
    `${runner?.name ?? "A runner"} ${existing ? "changed their bid to" : "bid"} ${formatPrice(price)} on "${task.title}"`,
    `/user/tasks/${taskId}`,
  );
  return bid;
}

export async function withdrawBid(taskId: string, actingUser: ActingUser) {
  await openTask(taskId);
  const result = await prisma.bid.deleteMany({
    where: { taskId, runnerId: actingUser.id, status: BidStatus.OPEN },
  });
  if (result.count === 0) {
    throw new TaskStatusError("You have no open bid on this errand.");
  }
}

// The poster answers a specific bid with a different price. The runner can
// accept it (their bid becomes that price) or ignore it.
export async function counterBid(
  taskId: string,
  bidId: string,
  price: number,
  actingUser: ActingUser,
) {
  const task = await openTask(taskId);
  if (task.posterId !== actingUser.id) {
    throw new TaskStatusError("Only the poster can counter a bid.");
  }
  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid || bid.taskId !== taskId || bid.status !== BidStatus.OPEN) {
    throw new TaskStatusError("That bid is no longer available.");
  }
  if (price === bid.price) {
    throw new TaskStatusError("That's their bid already. Just award it.");
  }

  const result = await prisma.bid.updateMany({
    where: { id: bidId, status: BidStatus.OPEN, price: bid.price },
    data: { counterPrice: price },
  });
  if (result.count === 0) {
    throw new TaskStatusError("The bid changed. Refresh and try again.");
  }
  await notify(
    bid.runnerId,
    `The poster countered ${formatPrice(price)} on "${task.title}"`,
    `/runner/tasks/${taskId}`,
  );
}

export async function acceptCounter(taskId: string, actingUser: ActingUser) {
  const task = await openTask(taskId);
  const bid = await prisma.bid.findUnique({
    where: { taskId_runnerId: { taskId, runnerId: actingUser.id } },
  });
  if (!bid || bid.status !== BidStatus.OPEN || bid.counterPrice === null) {
    throw new TaskStatusError("There is no counter to accept.");
  }

  const result = await prisma.bid.updateMany({
    where: { id: bid.id, status: BidStatus.OPEN, counterPrice: bid.counterPrice },
    data: { price: bid.counterPrice, counterPrice: null },
  });
  if (result.count === 0) {
    throw new TaskStatusError("The counter changed. Refresh and try again.");
  }
  const runner = await prisma.user.findUnique({ where: { id: actingUser.id }, select: { name: true } });
  await notify(
    task.posterId,
    `${runner?.name ?? "A runner"} accepted your counter of ${formatPrice(bid.counterPrice)} on "${task.title}"`,
    `/user/tasks/${taskId}`,
  );
}
