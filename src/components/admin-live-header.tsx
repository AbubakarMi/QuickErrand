"use client";

import { motion, useReducedMotion } from "motion/react";
import { Globe } from "lucide-react";

// The top of the admin's live view: a globe slowly turning inside a
// pulsing ring, "watching the whole platform" rather than the runner's
// "listening for my own work" broadcast motif (see broadcast-header.tsx),
// visually distinct on purpose even though the mechanics are the same
// idea. Reduced-motion users get the icon and count without any motion.
export function AdminLiveHeader({ count }: { count: number }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-10 text-center">
      <div className="relative mx-auto flex size-20 items-center justify-center">
        {!prefersReducedMotion &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border border-primary/40 bg-primary/10"
              animate={{ scale: [1, 3.2], opacity: [0.6, 0] }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                delay: i * 0.85,
                ease: "easeOut",
              }}
            />
          ))}
        <motion.span
          className="relative grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm"
          animate={prefersReducedMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
          <Globe className="size-7" />
        </motion.span>
      </div>

      <h1 className="mt-8 font-heading text-2xl font-semibold tracking-tight">
        {count} errand{count === 1 ? "" : "s"} live right now
      </h1>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
        Everything posted, being negotiated, or already awarded and running,
        across the whole platform. Updates on its own.
      </p>
    </div>
  );
}
