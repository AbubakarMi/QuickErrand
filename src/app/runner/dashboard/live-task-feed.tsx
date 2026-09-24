"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { Category } from "@prisma/client";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/formatPrice";
import type { PoolTask } from "@/lib/runnerPool";
import { sortTasksBySpecialty } from "@/lib/sortTasksBySpecialty";
import { BidControl } from "@/components/bid-control";
import { TimeAgo } from "@/components/time-ago";

const POLL_MS = 4000;

// The runner's list of open errands. `live` is the /runner/live page: it
// polls the pool every few seconds and marks anything that turns up after
// the page opened as new. Without it (the dashboard) it's just the
// server-rendered list.
export function LiveTaskFeed({
  initialTasks,
  runnerCategory,
  categoryFilter,
  live = false,
}: {
  initialTasks: PoolTask[];
  runnerCategory: Category | null;
  categoryFilter?: Category;
  live?: boolean;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const knownIds = useRef(new Set(initialTasks.map((t) => t.id)));

  // Re-sync whenever the server hands us a fresh list, either because the
  // category filter navigation re-rendered the page, or because a bid's
  // router.refresh() did. Adjusted during render rather than in an effect,
  // React's documented pattern for resetting state off a changed prop.
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks);
  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }

  useEffect(() => {
    if (!live) return;
    const poll = async () => {
      const url = categoryFilter
        ? `/api/tasks?category=${categoryFilter}`
        : "/api/tasks";
      const response = await fetch(url);
      if (!response.ok) return;
      const body: { tasks: PoolTask[] } = await response.json();

      const arrivals = body.tasks
        .map((t) => t.id)
        .filter((id) => !knownIds.current.has(id));
      if (arrivals.length > 0) {
        arrivals.forEach((id) => knownIds.current.add(id));
        setNewIds((prev) => new Set([...prev, ...arrivals]));
      }
      setTasks(body.tasks);
    };
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [live, categoryFilter]);

  const sortedTasks = sortTasksBySpecialty(tasks, runnerCategory);

  if (sortedTasks.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center sm:p-10">
        <p className="text-sm font-medium">
          {live ? "Nothing new yet" : "Nothing open right now"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {live
            ? "Still listening, this fills in as soon as something is posted."
            : "Check back soon, or go live to watch for new errands as they come in."}
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-3 sm:mt-8">
      <AnimatePresence initial={false}>
        {sortedTasks.map((task) => (
          <motion.li
            key={task.id}
            layout
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <Link href={`/runner/tasks/${task.id}`} className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium hover:underline">{task.title}</p>
                {newIds.has(task.id) && (
                  <span className="shrink-0 rounded-full bg-brand-coral px-2 py-0.5 text-xs font-medium text-brand-coral-foreground">
                    New
                  </span>
                )}
                {task.myBid?.counterPrice != null && (
                  <span className="shrink-0 rounded-full bg-brand-coral px-2 py-0.5 text-xs font-medium text-brand-coral-foreground">
                    Poster countered
                  </span>
                )}
                {task.category === runnerCategory && (
                  <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    Your specialty
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {categoryLabel(task.category)} · {task.location} · {formatPrice(task.price)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <TimeAgo date={task.createdAt} prefix="Posted " /> by {task.poster.name}
                {task.bidCount > 0 && ` · ${task.bidCount} bid${task.bidCount === 1 ? "" : "s"}`}
              </p>
            </Link>
            <BidControl taskId={task.id} askingPrice={task.price} myBid={task.myBid} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
