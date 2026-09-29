"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { Category, TaskStatus } from "@prisma/client";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/formatPrice";
import { TimeAgo } from "@/components/time-ago";

export type LiveTask = {
  id: string;
  title: string;
  category: Category;
  price: number;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  poster: { name: string };
  runner: { name: string } | null;
  bidCount: number;
};

// What each active status actually means right now, phrased for someone
// watching the whole platform rather than one errand, "negotiating" is
// this project's own word for an open, unbid PENDING errand vs one with
// offers on it, distinct enough to be worth saying out loud here. Shared
// by the globe (admin-live-globe.tsx) and this list so the two views
// never disagree on wording.
export function phase(task: LiveTask): { label: string; colorVar: string } {
  if (task.status === "PENDING") {
    return task.bidCount > 0
      ? { label: `Negotiating · ${task.bidCount} bid${task.bidCount === 1 ? "" : "s"}`, colorVar: "--status-pending" }
      : { label: "Waiting for bids", colorVar: "--status-pending" };
  }
  if (task.status === "ACCEPTED") {
    return { label: "Accepted, not started", colorVar: "--status-accepted" };
  }
  return { label: "In progress", colorVar: "--status-in-progress" };
}

// The readable list beneath the globe (admin-live-globe.tsx): same live
// data, no spatial reading required. Both take their tasks from
// useLivePoll in the shared parent, admin-live-view.tsx, rather than
// polling twice.
export function AdminLiveFeed({ tasks, newIds }: { tasks: LiveTask[]; newIds: Set<string> }) {
  if (tasks.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center sm:p-10">
        <p className="text-sm font-medium">Nothing running right now</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Every errand on the platform is either finished or cancelled. This fills in the moment one isn&apos;t.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {tasks.map((task) => {
          const { label, colorVar } = phase(task);
          return (
            <motion.li
              key={task.id}
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-lg border border-border bg-card p-4"
            >
              <Link href={`/admin/tasks/${task.id}`} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium hover:underline">{task.title}</p>
                    {newIds.has(task.id) && (
                      <span className="shrink-0 rounded-full bg-brand-coral px-2 py-0.5 text-xs font-medium text-brand-coral-foreground">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {categoryLabel(task.category)} · {formatPrice(task.price)} · {task.poster.name}
                    {task.runner ? ` → ${task.runner.name}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <TimeAgo date={task.updatedAt} prefix="Updated " />
                  </p>
                </div>
                <span
                  className="shrink-0 self-start rounded-full px-2.5 py-1 text-xs font-medium sm:self-center"
                  style={{
                    backgroundColor: `color-mix(in oklch, var(${colorVar}), transparent 85%)`,
                    color: `var(${colorVar})`,
                  }}
                >
                  {label}
                </span>
              </Link>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
