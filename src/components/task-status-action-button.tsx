"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Every button that moves a task forward (accept, cancel, advance to
// in-progress, mark complete) is a thin wrapper around the same PATCH
// call, so it lives here once instead of once per page.
export function TaskStatusActionButton({
  taskId,
  newStatus,
  children,
  variant,
  className,
}: {
  taskId: string;
  newStatus: TaskStatus;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "destructive";
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
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
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant={variant}
        disabled={pending}
        onClick={handleClick}
        className={cn(className)}
      >
        {pending ? "Working…" : children}
      </Button>
      {error && (
        <p className="max-w-48 text-right text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
