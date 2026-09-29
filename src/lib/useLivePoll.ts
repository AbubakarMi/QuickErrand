"use client";

import { useEffect, useRef, useState } from "react";

const POLL_MS = 4000;

// Shared by the admin live globe and the list beneath it, one poll loop,
// not two. Tracks which ids are new since the page opened, same idea as
// the runner's live-task-feed, just factored out so two views can share
// one fetch instead of racing each other.
export function useLivePoll<T extends { id: string }>(initial: T[], url: string) {
  const [items, setItems] = useState(initial);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const knownIds = useRef(new Set(initial.map((t) => t.id)));

  useEffect(() => {
    const poll = async () => {
      const response = await fetch(url);
      if (!response.ok) return;
      const body: { tasks: T[] } = await response.json();

      const arrivals = body.tasks.map((t) => t.id).filter((id) => !knownIds.current.has(id));
      if (arrivals.length > 0) {
        arrivals.forEach((id) => knownIds.current.add(id));
        setNewIds((prev) => new Set([...prev, ...arrivals]));
      }
      setItems(body.tasks);
    };
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [url]);

  return { items, newIds };
}
