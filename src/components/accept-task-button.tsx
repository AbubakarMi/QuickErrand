"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentMethod } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { TaskStatusActionButton } from "@/components/task-status-action-button";

// Accepting is almost always a one-click action (TaskStatusActionButton
// handles that). The one exception: a BANK_TRANSFER task where this
// runner hasn't put payout details on file yet, they need somewhere to
// tell the poster to send money before they can commit to the job. Rather
// than block accepting entirely or bury this in a separate settings page,
// it's collected right here, once, then reused for every future task.
export function AcceptTaskButton({
  taskId,
  price,
  paymentMethod,
  hasBankDetails,
  label = "Accept",
}: {
  taskId: string;
  // The price on screen, sent so the server refuses if it has changed.
  price: number;
  paymentMethod: PaymentMethod;
  hasBankDetails: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (paymentMethod === "CASH" || hasBankDetails) {
    return (
      <TaskStatusActionButton
        taskId={taskId}
        newStatus="ACCEPTED"
        expectedPrice={price}
      >
        {label}
      </TaskStatusActionButton>
    );
  }

  if (!showForm) {
    return (
      <Button size="sm" onClick={() => setShowForm(true)}>
        {label}
      </Button>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const bankResponse = await fetch("/api/me/bank-details", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankName: formData.get("bankName"),
        bankAccountNumber: formData.get("bankAccountNumber"),
      }),
    });
    if (!bankResponse.ok) {
      const body = await bankResponse.json().catch(() => null);
      setError(body?.error ?? "Couldn't save your bank details.");
      setPending(false);
      return;
    }

    const acceptResponse = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACCEPTED", expectedPrice: price }),
    });
    setPending(false);
    if (!acceptResponse.ok) {
      const body = await acceptResponse.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-56 flex-col gap-2 rounded-lg border border-border bg-card p-3"
    >
      <p className="text-xs font-medium">
        Add your payout details to accept
      </p>
      <input
        name="bankName"
        required
        placeholder="Bank name"
        className="input h-8 text-xs"
      />
      <input
        name="bankAccountNumber"
        required
        placeholder="Account number"
        className="input h-8 text-xs"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="xs" disabled={pending}>
          {pending ? "Saving…" : "Save & accept"}
        </Button>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          onClick={() => setShowForm(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
