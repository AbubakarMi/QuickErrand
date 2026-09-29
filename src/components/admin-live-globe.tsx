"use client";

import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { CircleDot, Hammer, ShoppingBag, Sparkles, Wrench, Zap } from "lucide-react";
import type { Category } from "@prisma/client";
import { formatPrice } from "@/lib/formatPrice";
import { phase, type LiveTask } from "@/components/admin-live-feed";

const CATEGORY_ICON: Record<Category, typeof Wrench> = {
  GENERAL_ERRAND: ShoppingBag,
  PLUMBING: Wrench,
  CARPENTRY: Hammer,
  ELECTRICAL: Zap,
  CLEANING: Sparkles,
  OTHER: CircleDot,
};

// One ring per phase, innermost = most advanced. Radius and duration are
// percentages/seconds tuned by eye, not a formula.
const RINGS: {
  key: "IN_PROGRESS" | "ACCEPTED" | "PENDING";
  radius: number;
  duration: number;
  reverse: boolean;
  colorVar: string;
}[] = [
  { key: "IN_PROGRESS", radius: 22, duration: 20, reverse: false, colorVar: "--status-in-progress" },
  { key: "ACCEPTED", radius: 36, duration: 32, reverse: true, colorVar: "--status-accepted" },
  { key: "PENDING", radius: 48, duration: 44, reverse: false, colorVar: "--status-pending" },
];

const MAX_PER_RING = 10;

// A full-page "watching the whole platform" visualization: three rings of
// orbiting errand icons, one ring per phase, circling a centre that shows
// how many are live right now. Purely a richer way to see the same data
// admin-live-feed.tsx lists below it in an actually readable form, this
// is the spectacle, that's the detail. Nodes phase-shift around a single
// shared CSS path (see globals.css .admin-orbit-node) rather than each
// tracked in React state, so the animation costs nothing on re-render.
export function AdminLiveGlobe({ tasks, newIds }: { tasks: LiveTask[]; newIds: Set<string> }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      {/* the planet */}
      <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-primary to-brand-teal-deep shadow-[0_0_60px_-10px_var(--primary)]">
        <div className="flex size-full flex-col items-center justify-center text-primary-foreground">
          <span className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {tasks.length}
          </span>
          <span className="text-xs opacity-90">live now</span>
        </div>
      </div>

      {/* orbit guide rings, purely decorative */}
      {RINGS.map((ring) => (
        <div
          key={`guide-${ring.key}`}
          aria-hidden
          className="absolute rounded-full border border-border/70"
          style={{
            inset: `${50 - ring.radius}%`,
          }}
        />
      ))}

      {RINGS.map((ring) => {
        const ringTasks = tasks.filter((t) => t.status === ring.key).slice(0, MAX_PER_RING);
        return ringTasks.map((task, i) => {
          const Icon = CATEGORY_ICON[task.category];
          const offset = (i / Math.max(ringTasks.length, 1)) * 100;
          return (
            <Link
              key={task.id}
              href={`/admin/tasks/${task.id}`}
              title={`${task.title} · ${phase(task).label} · ${formatPrice(task.price)}`}
              aria-label={`${task.title}, ${phase(task).label}, ${formatPrice(task.price)}`}
              className="admin-orbit-node absolute top-0 left-0 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border shadow-sm transition-transform hover:z-10 hover:scale-125 sm:size-9"
              style={{
                offsetPath: `circle(${ring.radius}% at 50% 50%)`,
                offsetRotate: "0deg",
                offsetDistance: `${offset}%`,
                animation: prefersReducedMotion
                  ? undefined
                  : `admin-orbit ${ring.duration}s linear infinite${ring.reverse ? " reverse" : ""}`,
                animationDelay: `-${(offset / 100) * ring.duration}s`,
                backgroundColor: `color-mix(in oklch, var(${ring.colorVar}), var(--card) 25%)`,
                borderColor: `var(${ring.colorVar})`,
                color: `var(${ring.colorVar})`,
              }}
            >
              <Icon className="size-4" />
              {newIds.has(task.id) && (
                <span
                  aria-hidden
                  className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-brand-coral ring-2 ring-card"
                />
              )}
            </Link>
          );
        });
      })}
    </div>
  );
}
