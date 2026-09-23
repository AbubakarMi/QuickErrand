"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { Package, ShoppingBag, Wrench } from "lucide-react";

const STATUSES = [
  { key: "PENDING", label: "Pending", colorVar: "--status-pending" },
  { key: "ACCEPTED", label: "Accepted", colorVar: "--status-accepted" },
  { key: "IN_PROGRESS", label: "In progress", colorVar: "--status-in-progress" },
  { key: "COMPLETED", label: "Completed", colorVar: "--status-completed" },
] as const;

const STEP_MS = 2200;

const ROWS = [
  { icon: ShoppingBag, title: "Grocery pickup", note: "2 items on the list", phase: 0 },
  { icon: Wrench, title: "Fix leaking tap", note: "Kitchen sink", phase: 3 },
  { icon: Package, title: "Deliver documents", note: "To the office", phase: 1 },
] as const;

// The landing page hero visual. It's a mocked product preview, not a
// connected data view, but it's built from the same status vocabulary as
// the real app so it doubles as an honest preview of what tracking a task
// actually looks like.
export function LiveActivityCard() {
  const prefersReducedMotion = useReducedMotion();
  const [tick, setTick] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => setTick((t) => t + 1), STEP_MS);
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), {
    stiffness: 180,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), {
    stiffness: 180,
    damping: 20,
  });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: prefersReducedMotion ? 0 : rotateX,
        rotateY: prefersReducedMotion ? 0 : rotateY,
        transformPerspective: 900,
      }}
      className="w-full max-w-sm rounded-2xl border border-border bg-card/95 p-5 shadow-xl backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Nearby activity
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          Live preview
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        {ROWS.map((row) => {
          const status = STATUSES[(tick + row.phase) % STATUSES.length];
          const Icon = row.icon;
          return (
            <div
              key={row.title}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.note}
                </p>
              </div>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={status.key}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.25 }}
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: `color-mix(in oklch, var(${status.colorVar}), transparent 85%)`,
                    color: `var(${status.colorVar})`,
                  }}
                >
                  {status.label}
                </motion.span>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
