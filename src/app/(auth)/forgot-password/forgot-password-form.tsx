"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { KeyRound, Lock, Mail } from "lucide-react";
import { findAccount, resetPassword, type FindAccountState, type ResetState } from "./actions";
import { Button } from "@/components/ui/button";

const findInitial: FindAccountState = {};
const resetInitial: ResetState = {};

export function ForgotPasswordForm() {
  const [findState, findAction, findPending] = useActionState(findAccount, findInitial);
  const [resetState, resetAction, resetPending] = useActionState(resetPassword, resetInitial);

  // Once the email step resolves a question, stay on that step even if the
  // reset step below comes back with an error, so a wrong answer doesn't
  // bounce someone back to re-entering their email.
  if (findState.email && findState.question) {
    return (
      <motion.form
        action={resetAction}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-5"
      >
        <input type="hidden" name="email" value={findState.email} />

        <Field label={findState.question} htmlFor="securityAnswer">
          <div className="relative">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="securityAnswer"
              name="securityAnswer"
              required
              autoComplete="off"
              placeholder="Your answer"
              className="input pl-9"
            />
          </div>
        </Field>

        <Field label="New password" htmlFor="password">
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="input pl-9"
            />
          </div>
        </Field>

        {resetState.error && (
          <p className="text-sm text-destructive" role="alert">
            {resetState.error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={resetPending} className="mt-1">
          {resetPending ? "Saving…" : "Reset password"}
        </Button>
      </motion.form>
    );
  }

  return (
    <motion.form
      action={findAction}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      <Field label="Email" htmlFor="email">
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="input pl-9"
          />
        </div>
      </Field>

      {findState.error && (
        <p className="text-sm text-destructive" role="alert">
          {findState.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={findPending} className="mt-1">
        {findPending ? "Looking…" : "Continue"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </motion.form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
