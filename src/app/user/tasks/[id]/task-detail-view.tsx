"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PaymentMethod, TaskStatus } from "@prisma/client";
import { buttonVariants } from "@/components/ui/button";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/formatPrice";
import { StatusBadge } from "@/components/status-badge";
import { SearchingIndicator } from "@/components/searching-indicator";
import { ContactCard } from "@/components/contact-card";
import { TaskStatusActionButton } from "@/components/task-status-action-button";
import { CounterOfferCard } from "@/components/counter-offer-card";
import { PaymentRecordCard } from "@/components/payment-record-card";

export type PosterTask = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: TaskStatus;
  price: number;
  paymentMethod: PaymentMethod;
  negotiatedPrice: number | null;
  negotiatedByRunner: { name: string } | null;
  offerAgreedAt: Date | string | null;
  offerBy: "RUNNER" | "POSTER" | null;
  paidAt: Date | string | null;
  paymentConfirmedAt: Date | string | null;
  runner: {
    name: string;
    phone: string | null;
    bankAccountNumber: string | null;
    bankName: string | null;
  } | null;
};

const OPEN_STATUSES = new Set<TaskStatus>(["PENDING", "ACCEPTED", "IN_PROGRESS"]);
const POLL_MS = 6000;

// The server-rendered page hands this its first fetch, then this polls
// GET /api/tasks/:id while the task is still open so a runner accepting
// (or advancing status) shows up here without a manual refresh. Polling
// stops on its own once the task is COMPLETED or CANCELLED.
export function UserTaskDetailView({ initialTask }: { initialTask: PosterTask }) {
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
    // finished too, the runner's confirmation lands after completion.
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

      <div className="mt-8 rounded-xl border border-border bg-card">
        {task.status === "PENDING" && (
          <SearchingIndicator
            label={
              task.offerAgreedAt && task.negotiatedByRunner
                ? `Waiting for ${task.negotiatedByRunner.name} to confirm`
                : undefined
            }
          />
        )}

        {task.status === "PENDING" &&
          task.negotiatedPrice !== null &&
          task.negotiatedByRunner &&
          task.offerBy && (
            <CounterOfferCard
              taskId={task.id}
              askingPrice={task.price}
              offerPrice={task.negotiatedPrice}
              runnerName={task.negotiatedByRunner.name}
              offerBy={task.offerBy}
              agreed={!!task.offerAgreedAt}
            />
          )}

        {(task.status === "ACCEPTED" ||
          task.status === "IN_PROGRESS" ||
          task.status === "COMPLETED") &&
          task.runner && (
          <div className="p-4">
            <ContactCard
              label="Runner"
              name={task.runner.name}
              phone={task.runner.phone}
              bankAccountNumber={
                task.paymentMethod === "BANK_TRANSFER"
                  ? task.runner.bankAccountNumber
                  : undefined
              }
              bankName={
                task.paymentMethod === "BANK_TRANSFER"
                  ? task.runner.bankName
                  : undefined
              }
            />
          </div>
        )}
      </div>

      {/* A poster can only cancel while PENDING, when no runner is assigned,
          so a cancelled errand that has a runner means that runner backed
          out. Say so, otherwise it just silently turns "Cancelled". */}
      {task.status === "CANCELLED" && task.runner && (
        <div className="mt-6 rounded-lg border border-border bg-muted p-4 text-sm">
          <p className="font-medium">{task.runner.name} backed out</p>
          <p className="mt-1 text-muted-foreground">
            This errand was cancelled. You can post it again and another
            runner can pick it up.
          </p>
          <Link
            href="/user/tasks/new"
            className={buttonVariants({ size: "sm", className: "mt-3" })}
          >
            Post it again
          </Link>
        </div>
      )}

      {task.status === "COMPLETED" && (
        <PaymentRecordCard
          taskId={task.id}
          viewer="POSTER"
          paidAt={task.paidAt}
          paymentConfirmedAt={task.paymentConfirmedAt}
        />
      )}

      {task.status === "PENDING" && (
        <div className="mt-6">
          <TaskStatusActionButton
            taskId={task.id}
            newStatus="CANCELLED"
            variant="outline"
          >
            Cancel errand
          </TaskStatusActionButton>
        </div>
      )}
    </div>
  );
}
