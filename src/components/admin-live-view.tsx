"use client";

import { useLivePoll } from "@/lib/useLivePoll";
import { AdminLiveGlobe } from "@/components/admin-live-globe";
import { AdminLiveFeed, type LiveTask } from "@/components/admin-live-feed";

// Owns the one poll loop (useLivePoll) and hands the same live tasks to
// both views: the globe up top for the spectacle, the list below for
// actually reading what's happening. Neither fetches on its own.
export function AdminLiveView({ initialTasks }: { initialTasks: LiveTask[] }) {
  const { items: tasks, newIds } = useLivePoll<LiveTask>(initialTasks, "/api/admin/live");

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AdminLiveGlobe tasks={tasks} newIds={newIds} />

      <div className="mx-auto mt-6 flex max-w-sm flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Legend colorVar="--status-in-progress" label="In progress" />
        <Legend colorVar="--status-accepted" label="Accepted" />
        <Legend colorVar="--status-pending" label="Negotiating" />
      </div>

      <h2 className="mt-10 font-heading text-lg font-semibold tracking-tight">All active errands</h2>
      <AdminLiveFeed tasks={tasks} newIds={newIds} />
    </div>
  );
}

function Legend({ colorVar, label }: { colorVar: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: `var(${colorVar})` }} />
      {label}
    </span>
  );
}
