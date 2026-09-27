"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// There's no email service in this project (see CLAUDE.md), so a reset
// can't go out as a mailed link. Instead it's a two-step form: look up the
// account's security question, then require the answer plus a new
// password before touching passwordHash. Two separate server actions
// (findAccount, resetPassword) because the second one needs its own
// verification, the client can't be trusted to only reach it after
// actually answering correctly.

const emailSchema = z.object({ email: z.email() });

export type FindAccountState = { error?: string; email?: string; question?: string };

export async function findAccount(
  _prevState: FindAccountState,
  formData: FormData,
): Promise<FindAccountState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { securityQuestion: true },
  });
  if (!user || !user.securityQuestion) {
    return { error: "No account with a security question on file for that email." };
  }

  return { email: parsed.data.email, question: user.securityQuestion };
}

const resetSchema = z.object({
  email: z.email(),
  securityAnswer: z.string().trim().min(1, "An answer is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetState = { error?: string };

export async function resetPassword(
  _prevState: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, securityAnswerHash: true },
  });
  if (!user || !user.securityAnswerHash) {
    return { error: "Something went wrong, start over." };
  }

  const answerMatches = await bcrypt.compare(
    parsed.data.securityAnswer.trim().toLowerCase(),
    user.securityAnswerHash,
  );
  if (!answerMatches) {
    return { error: "That answer doesn't match what's on file." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  redirect("/login?reset=1");
}
