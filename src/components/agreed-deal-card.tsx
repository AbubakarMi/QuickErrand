"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentMethod } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { AcceptTaskButton } from "@/components/accept-task-button";
import { formatPrice } from "@/lib/formatPrice";

// The runner's side once the poster has agreed to their price. The errand
// is reserved for them, and this is the moment they actually commit, so
// it's also where payout details get collected for a bank transfer. They
// can instead release the errand back to the pool.
export function AgreedDealCard({
  taskId,
  agreedPrice,
  paymentMethod,
  hasBankDetails,
}: {
  taskId: string;
  agreedPrice: number;
  paymentMethod: PaymentMethod;
  hasBankDetails: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function release() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/tasks/${taskId}/offer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "WITHDRAW" }),
    });
    setPending(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-6 rounded-lg border border-primary/40 bg-accent p-4">
      <p className="text-xs font-medium text-accent-foreground">Price agreed</p>
      <p className="mt-2 text-sm">
        The poster agreed to{" "}
        <span className="font-semibold">{formatPrice(agreedPrice)}</span>. This
        errand is held for you. Confirm to take it
        {paymentMethod === "BANK_TRANSFER"
          ? ", we'll ask for your bank details so you can be paid"
          : ""}
        .
      </p>
      <div className="mt-3 flex items-start gap-2">
        <AcceptTaskButton
          taskId={taskId}
          price={agreedPrice}
          paymentMethod={paymentMethod}
          hasBankDetails={hasBankDetails}
          label="Confirm and accept"
        />
        <Button size="sm" variant="outline" disabled={pending} onClick={release}>
          {pending ? "Releasing…" : "Release it"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
