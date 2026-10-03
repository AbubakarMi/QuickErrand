"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// The admin dashboard's one write action. Deactivating asks for
// confirmation first (it signs the person out immediately, see
// requireRole.ts), reactivating doesn't, it only ever restores access.
export function DeactivateUserButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setActive(next: boolean) {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: next }),
    });
    setPending(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  if (!isActive) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          size="sm"
          variant="outline"
          loading={pending}
          onClick={() => setActive(true)}
          className="hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
        >
          Reactivate
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
            Never mind
          </Button>
          <Button size="sm" variant="destructive" loading={pending} onClick={() => setActive(false)}>
            Confirm
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setConfirming(true)}
      className="hover:bg-destructive/10 hover:text-destructive"
    >
      Deactivate
    </Button>
  );
}
