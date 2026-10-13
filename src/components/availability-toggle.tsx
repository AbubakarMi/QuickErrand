"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Sits next to a runner's rating on their own dashboard. A single tap,
// optimistic like favorite-button.tsx, reverted if the request fails.
export function AvailabilityToggle({ initialAvailable }: { initialAvailable: boolean }) {
  const router = useRouter();
  const [available, setAvailable] = useState(initialAvailable);
  const [pending, setPending] = useState(false);

  async function toggle() {
    const next = !available;
    setAvailable(next);
    setPending(true);
    const response = await fetch("/api/me/availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: next }),
    });
    setPending(false);
    if (!response.ok) {
      setAvailable(!next);
      return;
    }
    router.refresh();
  }

  return (
    <Button
      size="sm"
      variant="outline"
      loading={pending}
      onClick={toggle}
      className={cn(
        "gap-1.5",
        available
          ? "border-primary/40 bg-accent text-accent-foreground hover:bg-accent/80"
          : "text-muted-foreground",
      )}
    >
      {!pending && (
        <span
          aria-hidden
          className={cn("size-2 rounded-full", available ? "bg-primary" : "bg-muted-foreground/50")}
        />
      )}
      {available ? "Available for work" : "Not available right now"}
    </Button>
  );
}
