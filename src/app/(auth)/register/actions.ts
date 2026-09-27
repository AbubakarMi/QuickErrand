"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SECURITY_QUESTIONS } from "@/lib/securityQuestions";

// A single account holds exactly one role, decided at registration (see
// plan §1). The category field only makes sense for runners, hence the
// discriminated union instead of one flat schema with optional fields.
// securityQuestion/securityAnswer are common to both: how /forgot-password
// verifies someone without an email service to send a reset link through.
const common = {
  name: z.string().trim().min(1, "Name is required"),
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  securityQuestion: z.enum(SECURITY_QUESTIONS),
  securityAnswer: z.string().trim().min(1, "An answer is required"),
};
const registerSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("USER"), ...common }),
  z.object({ role: z.literal("RUNNER"), ...common, category: z.enum(Category) }),
]);

export type RegisterState = { error?: string };

export async function registerUser(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  // Lowercased and trimmed before hashing so "Rex" and "rex " both match on
  // reset, the same tolerance a person expects from a security question.
  const securityAnswerHash = await bcrypt.hash(
    parsed.data.securityAnswer.trim().toLowerCase(),
    12,
  );

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      category: parsed.data.role === "RUNNER" ? parsed.data.category : null,
      securityQuestion: parsed.data.securityQuestion,
      securityAnswerHash,
    },
  });

  redirect("/login?registered=1");
}
