import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  bankName: z.string().trim().min(1, "Bank name is required").max(100),
  bankAccountNumber: z
    .string()
    .trim()
    .min(1, "Account number is required")
    .max(50),
});

// A runner's own payout details, set once and reused across every
// BANK_TRANSFER task rather than re-entered each time (see
// TASKS.md 3.6/3.8 for the scope note, this is coordination text, not a
// verified payment account).
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (session.user.role !== "RUNNER") {
    return NextResponse.json(
      { error: "Only runners have payout details." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
