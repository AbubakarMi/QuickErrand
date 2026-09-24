"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/formatPrice";

type MyBid = { price: number; counterPrice: number | null };

async function call(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.ok) return null;
  const data = await response.json().catch(() => null);
  return (data?.error as string | undefined) ?? "Something went wrong.";
}

// A runner's side of bidding on an errand, in one control that works in a
// list row and on the detail page. With no bid: bid the asking price in one
// tap, or name a different one. With a bid: see it, change or withdraw it,
// and if the poster countered, accept that.
export function BidControl({
  taskId,
  bidId,
  askingPrice,
  myBid,
}: {
  taskId: string;
  bidId?: string;
  askingPrice: number;
  myBid: MyBid | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<string | null>) {
    setPending(true);
    setError(null);
    const failure = await fn();
    setPending(false);
    if (failure) {
      setError(failure);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  const bid = (price: number) => run(() => call(`/api/tasks/${taskId}/bids`, "POST", { price }));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    bid(Number(new FormData(event.currentTarget).get("price")));
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      {myBid ? (
        <>
          <p className="text-sm">
            Your bid <span className="font-semibold">{formatPrice(myBid.price)}</span>
          </p>
          {myBid.counterPrice !== null && bidId && (
            <div className="flex flex-wrap items-center gap-2 rounded-md bg-accent px-2.5 py-1.5 text-sm">
              <span>
                Poster countered{" "}
                <span className="font-semibold">{formatPrice(myBid.counterPrice)}</span>
              </span>
              <Button
                size="xs"
                disabled={pending}
                onClick={() =>
                  run(() => call(`/api/tasks/${taskId}/bids/${bidId}`, "PATCH", { action: "ACCEPT_COUNTER" }))
                }
              >
                Accept
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Button size="xs" variant="outline" disabled={pending} onClick={() => setEditing((v) => !v)}>
              Change
            </Button>
            <Button
              size="xs"
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => call(`/api/tasks/${taskId}/bids`, "DELETE"))}
            >
              Withdraw
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={pending} onClick={() => bid(askingPrice)}>
            {pending ? "Bidding…" : `Bid ${formatPrice(askingPrice)}`}
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setEditing((v) => !v)}>
            Other price
          </Button>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSubmit} className="flex items-start gap-2">
          <input
            name="price"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
            autoFocus
            placeholder="Your price"
            className="input h-9 w-32"
          />
          <Button type="submit" size="sm" disabled={pending}>
            {myBid ? "Update" : "Bid"}
          </Button>
        </form>
      )}
      {error && <p className="max-w-64 text-xs text-destructive sm:text-right">{error}</p>}
    </div>
  );
}
