"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Radio } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

// The top of the runner's live mode: rings ping outward from a radio icon,
// the "broadcasting" motif, so it's obvious the app is actively listening
// for errands rather than sitting on a static list. Reduced-motion users
// get the icon and text without the rings.
export function BroadcastHeader() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-10 text-center">
      <div className="relative mx-auto flex size-20 items-center justify-center">
        {!prefersReducedMotion &&
          [0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border border-primary/40 bg-primary/10"
              animate={{ scale: [1, 4], opacity: [0.7, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.75,
                ease: "easeOut",
              }}
            />
          ))}
        <span className="relative grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Radio className="size-7" />
        </span>
      </div>

      <h1 className="mt-8 font-heading text-2xl font-semibold tracking-tight">
        You&apos;re live
      </h1>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
        Finding errands near you. New ones appear below the moment they&apos;re
        posted, your specialty first.
      </p>
      <Link
        href="/runner/dashboard"
        className={buttonVariants({ variant: "outline", size: "sm", className: "mt-5" })}
      >
        Stop
      </Link>
    </div>
  );
}
