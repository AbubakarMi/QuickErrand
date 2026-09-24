"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/formatPrice";

// The runner's side of a counter-offer, shown on a still-open errand.
// Sending again replaces the earlier offer (one active offer per errand).
export function MakeOfferForm({
  taskId,
  askingPrice,
  myOfferPrice,
}: {
  taskId: string;
  askingPrice: number;
  myOfferPrice: number | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withdraw() {
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch(`/api/tasks/${taskId}/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: Number(formData.get("price")) }),
    });
    setPending(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">
        Want a different price?
      </p>
      {myOfferPrice !== null && (
        <p className="mt-2 text-sm">
          Your offer of{" "}
          <span className="font-semibold">{formatPrice(myOfferPrice)}</span> is
          waiting on the poster. Sending a new one replaces it.{" "}
          <button
            type="button"
            onClick={withdraw}
            disabled={pending}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Withdraw it
          </button>
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-3 flex items-start gap-2">
        <input
          name="price"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          required
          placeholder={`Asking ${formatPrice(askingPrice)}`}
          className="input h-9 w-40"
        />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Sending…" : "Send offer"}
        </Button>
      </form>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
