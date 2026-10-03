"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Cancelling (or a runner backing out) asks why first, an optional reason
// that lands on the task record instead of just flipping the status. Same
// two-step reveal as awarding a bid: the button opens a small form in
// place rather than firing immediately.
export function CancelTaskButton({
  taskId,
  children,
  reasonPlaceholder = "Reason (optional)",
}: {
  taskId: string;
  children: React.ReactNode;
  reasonPlaceholder?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED", cancelReason: reason.trim() || undefined }),
    });
    setPending(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }
    router.refresh();
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {children}
      </Button>
    );
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-end gap-1.5">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={reasonPlaceholder}
        rows={2}
        maxLength={300}
        className="input h-auto w-full resize-none py-2"
        autoFocus
      />
      <div className="flex gap-1.5">
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
          Never mind
        </Button>
        <Button size="sm" variant="destructive" loading={pending} onClick={handleConfirm}>
          {`Confirm: ${typeof children === "string" ? children.toLowerCase() : "cancel"}`}
        </Button>
      </div>
      {error && <p className="text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
