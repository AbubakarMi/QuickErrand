"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

type DateLike = Date | string | null;

function formatDate(value: DateLike) {
  return value ? new Date(value).toLocaleDateString() : "";
}

// Shown on a COMPLETED errand. Purely a record of an off-platform payment:
// the poster marks it paid, then the runner confirms they got it.
export function PaymentRecordCard({
  taskId,
  viewer,
  paidAt,
  paymentConfirmedAt,
}: {
  taskId: string;
  viewer: "POSTER" | "RUNNER";
  paidAt: DateLike;
  paymentConfirmedAt: DateLike;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "MARK_PAID" | "CONFIRM_RECEIVED") {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/tasks/${taskId}/payment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
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
      <p className="text-xs font-medium text-muted-foreground">Payment record</p>
      <ol className="mt-3 flex flex-col gap-3">
        <Step
          done={!!paidAt}
          label={paidAt ? `Poster marked as paid on ${formatDate(paidAt)}` : "Poster pays and marks it paid"}
        />
        <Step
          done={!!paymentConfirmedAt}
          label={
            paymentConfirmedAt
              ? `Runner confirmed receipt on ${formatDate(paymentConfirmedAt)}`
              : "Runner confirms they received it"
          }
        />
      </ol>

      {viewer === "POSTER" && !paidAt && (
        <Button size="sm" className="mt-4" disabled={pending} onClick={() => act("MARK_PAID")}>
          {pending ? "Saving…" : "Mark as paid"}
        </Button>
      )}
      {viewer === "RUNNER" && paidAt && !paymentConfirmedAt && (
        <Button
          size="sm"
          className="mt-4"
          disabled={pending}
          onClick={() => act("CONFIRM_RECEIVED")}
        >
          {pending ? "Saving…" : "Confirm I received it"}
        </Button>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <p className="mt-3 text-xs text-muted-foreground">
        Payment happens outside the app. This is only a record.
      </p>
    </div>
  );
}

function Step({ done, label }: { done: boolean; label: string }) {
  const Icon = done ? CheckCircle2 : Circle;
  return (
    <li className="flex items-center gap-2 text-sm">
      <Icon className={done ? "size-4 text-primary" : "size-4 text-muted-foreground"} />
      <span className={done ? "" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}
