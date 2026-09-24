"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { TimeAgo } from "@/components/time-ago";
import { cn } from "@/lib/utils";

type Item = { id: string; message: string; href: string; createdAt: string; readAt: string | null };

const POLL_MS = 8000;

async function markRead(body: { ids: string[] } | { all: true }) {
  await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// The header bell. Notifications are stored events (bids, awards, back-outs,
// payments), polled so a new one shows up wherever the person is in the
// app, with a brief toast the moment it arrives. The first load never
// toasts: what was already waiting isn't news.
export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const seen = useRef<Set<string> | null>(null);

  async function load() {
    const response = await fetch("/api/notifications");
    if (!response.ok) return null;
    return (await response.json()) as { items: Item[]; unread: number };
  }

  useEffect(() => {
    let cancelled = false;
    let toastTimer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      const data = await load();
      if (!data || cancelled) return;
      setItems(data.items);
      setUnread(data.unread);

      const known = seen.current;
      if (known) {
        const fresh = data.items.find((i) => !i.readAt && !known.has(i.id));
        if (fresh) {
          setToast(fresh.message);
          clearTimeout(toastTimer);
          toastTimer = setTimeout(() => setToast(null), 6000);
        }
      }
      seen.current = new Set(data.items.map((i) => i.id));
    };

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      clearTimeout(toastTimer);
    };
  }, []);

  function open1(item: Item) {
    setOpen(false);
    if (!item.readAt) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, readAt: new Date().toISOString() } : i)));
      setUnread((n) => Math.max(0, n - 1));
      markRead({ ids: [item.id] });
    }
  }

  function readAll() {
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
    setUnread(0);
    markRead({ all: true });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-brand-coral px-1 text-[10px] leading-4 font-semibold text-brand-coral-foreground">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 z-30 rounded-lg border border-border bg-card shadow-lg sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-medium">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={readAll} className="text-xs font-medium text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto p-1">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => open1(item)}
                    className={cn(
                      "block rounded-md px-3 py-2.5 text-sm hover:bg-muted",
                      !item.readAt && "bg-accent/60",
                    )}
                  >
                    <span className={cn(!item.readAt && "font-medium")}>{item.message}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      <TimeAgo date={item.createdAt} />
                    </span>
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
          "pointer-events-none fixed inset-x-3 bottom-4 z-40 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-lg transition-all duration-300 sm:right-6 sm:left-auto sm:max-w-sm",
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        {toast}
      </div>
    </div>
  );
}
