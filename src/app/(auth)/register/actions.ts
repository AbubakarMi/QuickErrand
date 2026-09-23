"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// A single account holds exactly one role, decided at registration (see
// plan §1). The category field only makes sense for runners, hence the
// discriminated union instead of one flat schema with optional fields.
const registerSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("USER"),
    name: z.string().trim().min(1, "Name is required"),
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
  z.object({
    role: z.literal("RUNNER"),
    name: z.string().trim().min(1, "Name is required"),
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    category: z.enum(Category),
  }),
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

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      category: parsed.data.role === "RUNNER" ? parsed.data.category : null,
    },
  });

  redirect("/login?registered=1");
}
