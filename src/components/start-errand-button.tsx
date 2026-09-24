"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentMethod } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { TaskStatusActionButton } from "@/components/task-status-action-button";

// Starting is one tap, except on a bank transfer errand where this runner
// has no payout details yet: bids didn't need them, but the poster has to
// have somewhere to send the money, so they're collected here, once, then
// reused for every future errand.
export function StartErrandButton({
  taskId,
  paymentMethod,
  hasBankDetails,
}: {
  taskId: string;
  paymentMethod: PaymentMethod;
  hasBankDetails: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (paymentMethod === "CASH" || hasBankDetails) {
    return (
      <TaskStatusActionButton taskId={taskId} newStatus="IN_PROGRESS">
        Start errand
      </TaskStatusActionButton>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const bank = await fetch("/api/me/bank-details", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankName: formData.get("bankName"),
        bankAccountNumber: formData.get("bankAccountNumber"),
      }),
    });
    if (!bank.ok) {
      const body = await bank.json().catch(() => null);
      setError(body?.error ?? "Couldn't save your bank details.");
      setPending(false);
      return;
    }

    const start = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    });
    setPending(false);
    if (!start.ok) {
      const body = await start.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-64 flex-col gap-2 rounded-lg border border-border bg-card p-3"
    >
      <p className="text-xs font-medium">Add your payout details to start</p>
      <input name="bankName" required placeholder="Bank name" className="input h-9 text-sm" />
      <input name="bankAccountNumber" required placeholder="Account number" className="input h-9 text-sm" />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save and start"}
      </Button>
    </form>
  );
}
