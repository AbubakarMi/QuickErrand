"use client";

import { useEffect, useState } from "react";
import type { BidStatus, PaymentMethod, TaskStatus } from "@prisma/client";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/formatPrice";
import type { UserRating } from "@/lib/userRating";
import { StatusBadge } from "@/components/status-badge";
import { ContactCard } from "@/components/contact-card";
import { TaskStatusActionButton } from "@/components/task-status-action-button";
import { BidControl } from "@/components/bid-control";
import { StartErrandButton } from "@/components/start-errand-button";
import { PaymentRecordCard } from "@/components/payment-record-card";
import { RatingCard } from "@/components/rating-card";
import { TimeAgo } from "@/components/time-ago";

export type RunnerTask = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: TaskStatus;
  price: number;
  paymentMethod: PaymentMethod;
  runnerId: string | null;
  createdAt: Date | string;
  // This runner's own bid, if any. Other runners' bids are never sent.
  myBid: { id: string; price: number; counterPrice: number | null; status: BidStatus } | null;
  bidCount: number;
  myRating: { score: number; comment: string | null } | null;
  ratingReceived: { score: number; comment: string | null } | null;
  posterRating: UserRating | null;
  paidAt: Date | string | null;
  paymentConfirmedAt: Date | string | null;
  // The poster's name and rating are fair game for anyone deciding whether
  // to bid. Their phone is null until this runner is the one assigned.
  poster: { id: string; name: string; phone: string | null } | null;
};

const OPEN_STATUSES = new Set<TaskStatus>(["PENDING", "ACCEPTED", "IN_PROGRESS"]);
const POLL_MS = 6000;

export function RunnerTaskDetailView({
  initialTask,
  runnerId,
  hasBankDetails,
}: {
  initialTask: RunnerTask;
  runnerId: string;
  hasBankDetails: boolean;
}) {
  const [task, setTask] = useState(initialTask);

  // Take the server's fresh copy right away after an action calls
  // router.refresh(), instead of waiting up to a full poll interval.
  const [prevInitialTask, setPrevInitialTask] = useState(initialTask);
  if (initialTask !== prevInitialTask) {
    setPrevInitialTask(initialTask);
    setTask(initialTask);
  }

  useEffect(() => {
    // A COMPLETED errand keeps polling until the payment record is
    // finished too, the poster's "paid" mark lands after completion.
    const stillChanging =
      OPEN_STATUSES.has(task.status) ||
      (task.status === "COMPLETED" && !task.paymentConfirmedAt);
    if (!stillChanging) return;
    const id = setInterval(async () => {
      const response = await fetch(`/api/tasks/${task.id}`);
      if (!response.ok) return;
      const body = await response.json();
      setTask(body.task);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [task.status, task.id, task.paymentConfirmedAt]);

  const isAssignedRunner = task.runnerId === runnerId;
  const lostOut = !isAssignedRunner && task.status !== "PENDING" && task.myBid !== null;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{task.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {categoryLabel(task.category)} · {task.location} · {formatPrice(task.price)} ·{" "}
            {task.paymentMethod === "CASH" ? "Cash" : "Bank transfer"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <TimeAgo date={task.createdAt} prefix="Posted " />
          </p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <p className="mt-6 text-sm text-foreground">{task.description}</p>

      {task.poster && task.status !== "CANCELLED" && (
        <div className="mt-8">
          <ContactCard
            label="Posted by"
            name={task.poster.name}
            phone={task.poster.phone}
            rating={task.posterRating}
            profileHref={`/runner/profile/${task.poster.id}`}
          />
        </div>
      )}

      {lostOut && (
        <div className="mt-6 rounded-lg border border-border bg-muted p-4 text-sm">
          <p className="font-medium">
            {task.status === "CANCELLED"
              ? "The poster cancelled this errand"
              : "This errand was awarded to another runner"}
          </p>
          <p className="mt-1 text-muted-foreground">
            Your bid was {formatPrice(task.myBid!.price)}. There are more errands waiting on your dashboard.
          </p>
        </div>
      )}

      {task.status === "COMPLETED" && isAssignedRunner && (
        <RatingCard
          taskId={task.id}
          counterpartName={task.poster?.name ?? "the poster"}
          given={task.myRating}
          received={task.ratingReceived}
        />
      )}

      {task.status === "COMPLETED" && isAssignedRunner && (
        <PaymentRecordCard
          taskId={task.id}
          viewer="RUNNER"
          paidAt={task.paidAt}
          paymentConfirmedAt={task.paymentConfirmedAt}
        />
      )}

      {task.status === "PENDING" && (
        <div className="mt-6 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Bid on this errand
            {task.bidCount > 0 && ` · ${task.bidCount} bid${task.bidCount === 1 ? "" : "s"} so far`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The poster looks at every bid and awards the errand to one runner.
          </p>
          <div className="mt-3">
            <BidControl
              taskId={task.id}
              bidId={task.myBid?.id}
              askingPrice={task.price}
              myBid={task.myBid}
            />
          </div>
        </div>
      )}

      {isAssignedRunner && task.status === "ACCEPTED" && (
        <div className="mt-6 rounded-xl border border-primary/40 bg-accent p-4">
          <p className="text-xs font-medium text-accent-foreground">Awarded to you</p>
          <p className="mt-1 text-sm">
            The poster chose you at <span className="font-semibold">{formatPrice(task.price)}</span>.
            Start when you&apos;re ready to begin.
          </p>
          <div className="mt-3 flex flex-wrap items-start gap-2">
            <StartErrandButton
              taskId={task.id}
              paymentMethod={task.paymentMethod}
              hasBankDetails={hasBankDetails}
            />
            <TaskStatusActionButton taskId={task.id} newStatus="CANCELLED" variant="outline">
              Back out
            </TaskStatusActionButton>
          </div>
        </div>
      )}

      {isAssignedRunner && task.status === "IN_PROGRESS" && (
        <div className="mt-6">
          <TaskStatusActionButton taskId={task.id} newStatus="COMPLETED">
            Mark complete
          </TaskStatusActionButton>
        </div>
      )}
    </div>
  );
}
