"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentMethod } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { AcceptTaskButton } from "@/components/accept-task-button";
import { formatPrice } from "@/lib/formatPrice";

// The runner's side when the poster has countered their offer. Accepting
// is the runner's commitment (so a bank transfer asks for bank details
// right here), it's a plain accept priced at the counter. They can also
// turn it down, or answer with another price using the form below.
export function PosterCounterCard({
  taskId,
  counterPrice,
  paymentMethod,
  hasBankDetails,
}: {
  taskId: string;
  counterPrice: number;
  paymentMethod: PaymentMethod;
  hasBankDetails: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decline() {
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
    <div className="mt-6 rounded-lg border border-brand-coral/50 bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">Poster countered</p>
      <p className="mt-2 text-sm">
        The poster came back with{" "}
        <span className="font-semibold">{formatPrice(counterPrice)}</span>. Accepting takes the errand at that price
        {paymentMethod === "BANK_TRANSFER"
          ? ", and we'll ask for your bank details so you can be paid"
          : ""}
        .
      </p>
      <div className="mt-3 flex items-start gap-2">
        <AcceptTaskButton
          taskId={taskId}
          price={counterPrice}
          paymentMethod={paymentMethod}
          hasBankDetails={hasBankDetails}
          label={`Accept ${formatPrice(counterPrice)}`}
        />
        <Button size="sm" variant="outline" disabled={pending} onClick={decline}>
          {pending ? "Working…" : "Decline"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
