"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Shown on a runner's profile, poster-side only (see the route wrapper).
// No confirm step either direction, unlike deactivate-user-button.tsx,
// favoriting isn't destructive, there's nothing to protect against
// clicking by accident.
export function FavoriteButton({ runnerId, initialFavorited }: { runnerId: string; initialFavorited: boolean }) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  async function toggle() {
    const next = !favorited;
    setFavorited(next); // optimistic, reverted on failure
    setPending(true);
    const response = await fetch(`/api/favorites/${runnerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorited: next }),
    });
    setPending(false);
    if (!response.ok) {
      setFavorited(!next);
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
      className={cn(favorited && "border-brand-coral/40 bg-brand-coral/10 text-brand-coral hover:bg-brand-coral/15")}
    >
      {!pending && <Heart className={cn("size-4", favorited && "fill-brand-coral")} />}
      {favorited ? "Favorited" : "Save as favorite"}
    </Button>
  );
}
