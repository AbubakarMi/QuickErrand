"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, MapPin, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveActivityCard } from "@/components/live-activity-card";
import { MarqueeTicker } from "@/components/marquee-ticker";

const STEPS = [
  {
    number: "01",
    title: "Post your errand",
    body: "Say what you need done, pick a category, and drop a location. Takes under a minute.",
  },
  {
    number: "02",
    title: "A runner accepts it",
    body: "Nearby runners browse open tasks in their category and pick yours up. No dispatch queue, no waiting on a match.",
  },
  {
    number: "03",
    title: "Track it live",
    body: "Watch the status move from accepted to in progress to done, then rate the runner when it's finished.",
  },
];

export function LandingContent() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="hero-blob-a pointer-events-none absolute -top-40 -left-32 size-[36rem] rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="hero-blob-b pointer-events-none absolute -top-20 -right-40 size-[32rem] rounded-full bg-brand-coral/20 blur-3xl"
        />

        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-16 px-6 py-20 sm:px-10 sm:py-28 lg:grid-cols-[1.1fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Live task tracking
            </span>
            <h1 className="mt-4 font-heading text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              Post it. Get matched.
              <br />
              Watch it move.
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground text-balance">
              QuickErrand connects you with nearby runners for errands,
              repairs, and odd jobs. Track every step from pending to done,
              in real time.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-brand-coral text-brand-coral-foreground hover:bg-brand-coral/90"
                render={<Link href="/register" />}
              >
                Post an errand
                <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/register?role=runner" />}
              >
                Become a runner
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <LiveActivityCard />
          </motion.div>
        </div>
      </section>

      <MarqueeTicker />

      <section className="mx-auto w-full max-w-5xl px-6 py-24 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="max-w-lg"
        >
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            How it works
          </h2>
          <p className="mt-2 text-muted-foreground">
            Three steps, no app install, no dispatcher in the middle.
          </p>
        </motion.div>

        <div className="relative mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div
            aria-hidden
            className="absolute top-6 right-0 left-0 hidden h-px bg-border sm:block"
          />
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative"
            >
              <span className="relative z-10 flex size-12 items-center justify-center rounded-full border border-border bg-background font-heading text-sm font-semibold text-primary">
                {step.number}
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          <Feature
            icon={<MapPin className="size-5 text-primary" />}
            title="Local matching"
            body="Runners browse and accept tasks near them. No algorithm to fight with."
          />
          <Feature
            icon={<Zap className="size-5 text-primary" />}
            title="Live status"
            body="Every task moves through pending, accepted, in progress, and completed, visible the moment it changes."
          />
          <Feature
            icon={<ShieldCheck className="size-5 text-primary" />}
            title="Rated runners"
            body="Every completed task gets rated, so reliable runners stand out over time."
          />
        </motion.div>
      </section>

      <section className="px-6 pb-24 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto flex w-full max-w-5xl flex-col items-center overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center"
        >
          <div
            aria-hidden
            className="hero-blob-b pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand-coral/30 blur-3xl"
          />
          <h2 className="relative font-heading text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
            Get your first errand moving today.
          </h2>
          <p className="relative mt-3 max-w-md text-primary-foreground/80">
            Create an account and post your first task. It takes less than a
            minute.
          </p>
          <Button
            size="lg"
            className="relative mt-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            render={<Link href="/register" />}
          >
            Create your account
            <ArrowRight />
          </Button>
        </motion.div>
      </section>
    </>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md">
      {icon}
      <h4 className="mt-3 font-heading text-sm font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
