"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { TimeAgo } from "@/components/time-ago";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/formatPrice";
import type { BidView } from "@/lib/bids";

async function call(taskId: string, bidId: string, body: unknown) {
  const response = await fetch(`/api/tasks/${taskId}/bids/${bidId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.ok) return null;
  const data = await response.json().catch(() => null);
  return (data?.error as string | undefined) ?? "Something went wrong.";
}

// Everything the poster needs to choose a runner: each bidder's price, star
// rating and record, a link to their full profile, and the two things they
// can do about it, counter with another price or award the errand. Awarding
// can't be undone (it tells every other bidder they lost), so it takes two
// taps.
export function BidsPanel({
  taskId,
  askingPrice,
  bids,
}: {
  taskId: string;
  askingPrice: number;
  bids: BidView[];
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [countering, setCountering] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(bidId: string, body: unknown) {
    setPending(true);
    setError(null);
    const failure = await call(taskId, bidId, body);
    setPending(false);
    if (failure) {
      setError(failure);
      return;
    }
    setConfirming(null);
    setCountering(null);
    router.refresh();
  }

  return (
    <div className="border-t border-border p-4">
      <p className="text-xs font-medium text-muted-foreground">
        {bids.length} bid{bids.length === 1 ? "" : "s"}, choose who gets it
      </p>

      <ul className="mt-3 flex flex-col gap-3">
        {bids.map((bid) => {
          const diff = bid.price - askingPrice;
          return (
            <li key={bid.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <Link
                    href={`/user/profile/${bid.runner.id}`}
                    className="-my-1 inline-block py-1 font-medium hover:underline"
                  >
                    {bid.runner.name}
                  </Link>
                  <div className="mt-1">
                    <StarRating value={bid.rating.average} count={bid.rating.count} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {bid.completed} errand{bid.completed === 1 ? "" : "s"} completed
                    {bid.runner.category ? `, ${categoryLabel(bid.runner.category)}` : ""} ·{" "}
                    <TimeAgo date={bid.createdAt} prefix="bid " />
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-heading text-xl font-semibold">{formatPrice(bid.price)}</p>
                  <p className="text-xs text-muted-foreground">
                    {diff === 0
                      ? "your asking price"
                      : `${formatPrice(Math.abs(diff))} ${diff < 0 ? "under" : "over"} your ask`}
                  </p>
                </div>
              </div>

              {bid.counterPrice !== null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  You countered {formatPrice(bid.counterPrice)}, waiting for their reply.
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {confirming === bid.id ? (
                  <>
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => run(bid.id, { action: "AWARD", expectedPrice: bid.price })}
                    >
                      {pending ? "Awarding…" : `Confirm: award to ${bid.runner.name}`}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" disabled={pending} onClick={() => { setConfirming(bid.id); setCountering(null); }}>
                      Award
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => { setCountering(countering === bid.id ? null : bid.id); setConfirming(null); }}
                    >
                      Counter
                    </Button>
                  </>
                )}
              </div>

              {countering === bid.id && (
                <form
                  className="mt-3 flex items-start gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    run(bid.id, { action: "COUNTER", price: Number(new FormData(event.currentTarget).get("price")) });
                  }}
                >
                  <input
                    name="price"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    required
                    autoFocus
                    placeholder="Your price"
                    className="input h-9 w-36"
                  />
                  <Button type="submit" size="sm" variant="outline" disabled={pending}>
                    Send counter
                  </Button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </div>
  );
}
