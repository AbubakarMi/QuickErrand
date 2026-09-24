"use client";

import { useEffect, useState } from "react";
import type { PaymentMethod, TaskStatus } from "@prisma/client";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/formatPrice";
import { StatusBadge } from "@/components/status-badge";
import { ContactCard } from "@/components/contact-card";
import { TaskStatusActionButton } from "@/components/task-status-action-button";
import { AcceptTaskButton } from "@/components/accept-task-button";
import { MakeOfferForm } from "@/components/make-offer-form";
import { PaymentRecordCard } from "@/components/payment-record-card";
import { AgreedDealCard } from "@/components/agreed-deal-card";
import { PosterCounterCard } from "@/components/poster-counter-card";

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
  // Only ever this runner's own offer, other runners' offers are masked to
  // null by the server (page and API both).
  negotiatedPrice: number | null;
  negotiatedByRunnerId: string | null;
  offerAgreedAt: Date | string | null;
  offerBy: "RUNNER" | "POSTER" | null;
  paidAt: Date | string | null;
  paymentConfirmedAt: Date | string | null;
  // null both when there's genuinely no poster contact to show and when
  // the caller isn't entitled to see it yet (an unclaimed task being
  // previewed). The server never sends a phone number to a client that
  // hasn't accepted the task, same rule GET /api/tasks/:id enforces.
  poster: { name: string; phone: string | null } | null;
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
  const isMine = task.negotiatedByRunnerId === runnerId;
  // The runner's own offer waiting on the poster, versus the poster's
  // counter waiting on the runner. Never another runner's.
  const myOfferPrice =
    isMine && task.offerBy === "RUNNER" ? task.negotiatedPrice : null;
  const posterCounterPrice =
    isMine && task.offerBy === "POSTER" ? task.negotiatedPrice : null;
  const isReservedForMe =
    task.offerAgreedAt !== null && isMine && task.negotiatedPrice !== null;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {categoryLabel(task.category)} · {task.location} ·{" "}
            {formatPrice(task.price)} ·{" "}
            {task.paymentMethod === "CASH" ? "Cash" : "Bank transfer"}
          </p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <p className="mt-6 text-sm text-foreground">{task.description}</p>

      {isAssignedRunner && task.poster && (
        <div className="mt-8">
          <ContactCard
            label="Posted by"
            name={task.poster.name}
            phone={task.poster.phone}
          />
        </div>
      )}

      {task.status === "COMPLETED" && isAssignedRunner && (
        <PaymentRecordCard
          taskId={task.id}
          viewer="RUNNER"
          paidAt={task.paidAt}
          paymentConfirmedAt={task.paymentConfirmedAt}
        />
      )}

      {task.status === "PENDING" && isReservedForMe && task.negotiatedPrice !== null && (
        <AgreedDealCard
          taskId={task.id}
          agreedPrice={task.negotiatedPrice}
          paymentMethod={task.paymentMethod}
          hasBankDetails={hasBankDetails}
        />
      )}

      {task.status === "PENDING" && !isReservedForMe && posterCounterPrice !== null && (
        <PosterCounterCard
          taskId={task.id}
          counterPrice={posterCounterPrice}
          paymentMethod={task.paymentMethod}
          hasBankDetails={hasBankDetails}
        />
      )}

      {task.status === "PENDING" && !isReservedForMe && (
        <MakeOfferForm
          taskId={task.id}
          askingPrice={task.price}
          myOfferPrice={myOfferPrice}
        />
      )}

      <div className="mt-6 flex gap-3">
        {task.status === "PENDING" && !isReservedForMe && (
          <AcceptTaskButton
            taskId={task.id}
            price={task.price}
            paymentMethod={task.paymentMethod}
            hasBankDetails={hasBankDetails}
            label={
              posterCounterPrice !== null
                ? `Accept at ${formatPrice(task.price)}`
                : "Accept"
            }
          />
        )}
        {task.status === "ACCEPTED" && isAssignedRunner && (
          <>
            <TaskStatusActionButton taskId={task.id} newStatus="IN_PROGRESS">
              Start errand
            </TaskStatusActionButton>
            <TaskStatusActionButton
              taskId={task.id}
              newStatus="CANCELLED"
              variant="outline"
            >
              Back out
            </TaskStatusActionButton>
          </>
        )}
        {task.status === "IN_PROGRESS" && isAssignedRunner && (
          <TaskStatusActionButton taskId={task.id} newStatus="COMPLETED">
            Mark complete
          </TaskStatusActionButton>
        )}
      </div>
    </div>
  );
}
