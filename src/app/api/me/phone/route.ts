import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Digits plus the punctuation a phone number is actually written with,
// loose on purpose since this is never dialed by the app itself, only
// shown (and now tel: linked) to the other party on an errand.
const schema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-() ]{7,20}$/, "Enter a valid phone number"),
});

// Either role can set their own number, unlike bank details (runner-only).
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
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
    data: { phone: parsed.data.phone },
  });

  return NextResponse.json({ ok: true });
}
