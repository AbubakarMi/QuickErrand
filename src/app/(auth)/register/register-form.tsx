"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Bike, Mail, ShoppingBag, User as UserIcon } from "lucide-react";
import { registerUser, type RegisterState } from "./actions";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

const initialState: RegisterState = {};

type Role = "USER" | "RUNNER";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const preselectRunner = searchParams.get("role") === "runner";

  // Landing on /register?role=runner (the homepage's "Become a runner" CTA)
  // skips straight to the form with Runner preselected. Everyone else
  // picks a role first.
  const [step, setStep] = useState<"role" | "form">(
    preselectRunner ? "form" : "role",
  );
  const [role, setRole] = useState<Role>(preselectRunner ? "RUNNER" : "USER");
  const [state, formAction, pending] = useActionState(
    registerUser,
    initialState,
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === "role" ? (
        <motion.div
          key="role"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-3"
        >
          <RoleCard
            icon={<ShoppingBag className="size-5" />}
            title="Post errands"
            description="Get tasks done by nearby runners"
            onClick={() => {
              setRole("USER");
              setStep("form");
            }}
          />
          <RoleCard
            icon={<Bike className="size-5" />}
            title="Run errands"
            description="Browse tasks and earn by completing them"
            onClick={() => {
              setRole("RUNNER");
              setStep("form");
            }}
          />
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          action={formAction}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-5"
        >
          <input type="hidden" name="role" value={role} />

          {!preselectRunner && (
            <button
              type="button"
              onClick={() => setStep("role")}
              className="-mb-1 self-start text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              ← {role === "USER" ? "Posting errands" : "Running errands"},
              change
            </button>
          )}

          <Field label="Full name" htmlFor="name">
            <div className="relative">
              <UserIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="name"
                name="name"
                required
                autoComplete="name"
                placeholder="Jane Doe"
                className="input pl-9"
              />
            </div>
          </Field>

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

          <Field label="Password" htmlFor="password">
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="input"
            />
          </Field>

          {role === "RUNNER" && (
            <Field label="Category" htmlFor="category">
              <select
                id="category"
                name="category"
                required
                defaultValue=""
                className="input"
              >
                <option value="" disabled>
                  Choose what you do
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={pending} className="mt-1">
            {pending ? "Creating account…" : "Create account"}
          </Button>

          {preselectRunner && (
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Log in
              </Link>
            </p>
          )}
        </motion.form>
      )}
    </AnimatePresence>
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

function RoleCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors",
        "hover:border-primary hover:bg-accent",
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}
