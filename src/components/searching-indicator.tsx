"use client";

import { motion, useReducedMotion } from "motion/react";
import { Search } from "lucide-react";

// Shown on the poster's task detail page while a task is still PENDING.
// Three rings pulse outward from the center icon at staggered offsets,
// the classic "searching" motif. Falls back to a static (non-animating)
// icon for reduced-motion users rather than skipping the section.
export function SearchingIndicator({
  label = "Looking for a runner",
}: {
  label?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="relative flex size-16 items-center justify-center">
        {!prefersReducedMotion &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full bg-primary/30"
              animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut",
              }}
            />
          ))}
        <span className="relative grid size-16 place-items-center rounded-full bg-primary text-primary-foreground">
          <Search className="size-6" />
        </span>
      </div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">
        This updates automatically as soon as a runner accepts.
      </p>
    </div>
  );
}
