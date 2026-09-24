"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/formatPrice";

type Action = "AGREE" | "DECLINE" | "COUNTER";

// The poster's side of a negotiation. Three states, keyed off who put the
// price on the table and whether it's been agreed:
//  - the runner's offer is open: agree, decline, or counter with a price
//  - the poster's own counter is out: waiting on the runner, can withdraw
//  - agreed: the errand is held for that runner until they confirm
// Agreeing sends the price it displayed so the server can refuse if a
// different offer landed in the meantime.
export function CounterOfferCard({
  taskId,
  askingPrice,
  offerPrice,
  runnerName,
  offerBy,
  agreed,
}: {
  taskId: string;
  askingPrice: number;
  offerPrice: number;
  runnerName: string;
  offerBy: "RUNNER" | "POSTER";
  agreed: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(action: Action, extra: Record<string, unknown> = {}) {
    setPending(action);
    setError(null);
    const response = await fetch(`/api/tasks/${taskId}/offer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    setPending(null);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function handleCounter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const price = Number(new FormData(form).get("price"));
    if (await send("COUNTER", { price })) form.reset();
  }

  const busy = pending !== null;

  return (
    <div className="border-t border-border p-4">
      <p className="text-xs font-medium text-muted-foreground">
        {agreed ? "Price agreed" : "Negotiation"}
      </p>

      {agreed ? (
        <p className="mt-2 text-sm">
          You agreed to <span className="font-semibold">{formatPrice(offerPrice)}</span>{" "}
          with <span className="font-medium">{runnerName}</span>. The errand is
          held for them and no one else can take it. It&apos;s assigned once
          they confirm.
        </p>
      ) : offerBy === "RUNNER" ? (
        <p className="mt-2 text-sm">
          <span className="font-medium">{runnerName}</span> offers to do this
          for <span className="font-semibold">{formatPrice(offerPrice)}</span>{" "}
          <span className="text-muted-foreground">
            (you asked {formatPrice(askingPrice)})
          </span>
        </p>
      ) : (
        <p className="mt-2 text-sm">
          You countered with{" "}
          <span className="font-semibold">{formatPrice(offerPrice)}</span>.
          Waiting for <span className="font-medium">{runnerName}</span> to
          reply.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!agreed && offerBy === "RUNNER" && (
          <Button size="sm" disabled={busy} onClick={() => send("AGREE", { expectedPrice: offerPrice })}>
            {pending === "AGREE" ? "Agreeing…" : "Agree to this price"}
          </Button>
        )}
        <Button size="sm" variant="outline" disabled={busy} onClick={() => send("DECLINE")}>
          {pending === "DECLINE"
            ? "Working…"
            : agreed
              ? "Take it back"
              : offerBy === "POSTER"
                ? "Withdraw counter"
                : "Decline"}
        </Button>
      </div>

      {!agreed && offerBy === "RUNNER" && (
        <form onSubmit={handleCounter} className="mt-4 flex items-start gap-2 border-t border-border pt-4">
          <input
            name="price"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
            placeholder="Your price"
            className="input h-9 w-36"
          />
          <Button type="submit" size="sm" variant="outline" disabled={busy}>
            {pending === "COUNTER" ? "Sending…" : "Counter"}
          </Button>
        </form>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
