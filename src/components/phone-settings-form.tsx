"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

// The one editable field on your own profile page. Phone only ever shows
// to the other party on an errand you're actually part of (ContactCard),
// but there was nowhere in the app to set it, this is that.
export function PhoneSettingsForm({ currentPhone }: { currentPhone: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(currentPhone ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/me/phone", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setPending(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-sm">
        <Phone className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1">
          {currentPhone ?? <span className="text-muted-foreground">No phone number on file</span>}
        </span>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          {currentPhone ? "Edit" : "Add"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="mt-4 flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <label htmlFor="phone" className="text-xs font-medium text-muted-foreground">
        Phone number, shown only to whoever you&apos;re paired with on an errand
      </label>
      <div className="flex gap-2">
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+234 800 000 0000"
          className="input h-9 flex-1 text-sm"
          autoFocus
        />
        <Button type="submit" size="sm" loading={pending}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
