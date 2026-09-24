"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { cn } from "@/lib/utils";

type Rating = { score: number; comment: string | null };

// Shown on a COMPLETED errand to both the poster and the runner: rate the
// other person in stars with optional written feedback, and see the rating
// they left for you. Until you've rated, the form is what you see.
export function RatingCard({
  taskId,
  counterpartName,
  given,
  received,
}: {
  taskId: string;
  counterpartName: string;
  given: Rating | null;
  received: Rating | null;
}) {
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (score === 0) {
      setError("Tap a star to choose a rating");
      return;
    }
    setPending(true);
    setError(null);
    const comment = new FormData(event.currentTarget).get("comment");
    const response = await fetch(`/api/tasks/${taskId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, comment: comment || undefined }),
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
    <div className="mt-6 rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">
        {given ? `Your rating of ${counterpartName}` : `Rate ${counterpartName}`}
      </p>

      {given ? (
        <div className="mt-3">
          <StarRating value={given.score} size="md" />
          {given.comment && <p className="mt-2 text-sm">{given.comment}</p>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
          <div role="radiogroup" aria-label="Rating" className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={score === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setScore(n)}
                className="rounded p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "size-7",
                    n <= score
                      ? "fill-brand-coral text-brand-coral"
                      : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
          <textarea
            name="comment"
            rows={2}
            maxLength={500}
            placeholder="Feedback (optional)"
            className="input h-auto resize-none py-2"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" size="sm" className="self-start" disabled={pending}>
            {pending ? "Saving…" : "Submit rating"}
          </Button>
        </form>
      )}

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-xs font-medium text-muted-foreground">
          What {counterpartName} said about you
        </p>
        {received ? (
          <div className="mt-2">
            <StarRating value={received.score} size="md" />
            {received.comment && <p className="mt-2 text-sm">{received.comment}</p>}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No rating from {counterpartName} yet.
          </p>
        )}
      </div>
    </div>
  );
}
