"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { id: string; message: string; href: string };

const POLL_MS = 8000;

// Anything waiting on this person (see /api/notifications), polled so a
// new offer or counter shows up wherever they are in the app, with a brief
// toast the moment one arrives. The first load never toasts: things that
// were already waiting aren't news.
export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let toastTimer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok || cancelled) return;
      const body: { items: Item[] } = await response.json();
      setItems(body.items);

      const known = seen.current;
      if (known) {
        const fresh = body.items.find((i) => !known.has(i.id));
        if (fresh) {
          setToast(fresh.message);
          clearTimeout(toastTimer);
          toastTimer = setTimeout(() => setToast(null), 6000);
        }
      }
      seen.current = new Set(body.items.map((i) => i.id));
    };

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      clearTimeout(toastTimer);
    };
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          items.length > 0 ? `Notifications, ${items.length} waiting` : "Notifications"
        }
        aria-expanded={open}
        className="relative grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-4" />
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-brand-coral px-1 text-[10px] leading-4 font-semibold text-brand-coral-foreground">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-lg border border-border bg-card p-1 shadow-lg">
          {items.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              Nothing waiting on you.
            </p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2.5 text-sm hover:bg-muted"
                  >
                    {item.message}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed right-6 bottom-6 z-40 max-w-sm rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-lg transition-all duration-300",
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        {toast}
      </div>
    </div>
  );
}
