import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ isAvailable: z.boolean() });

// A runner's own "available for work" flag. Existed on the User model
// since the original schema but nothing ever read or wrote it, this is
// that: a signal a poster sees next to a bid, not a filter that hides a
// runner from the pool, going quiet for a day shouldn't make someone
// invisible, just honest about whether they're actually around right now.
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "RUNNER") {
    return NextResponse.json({ error: "Only runners have an availability status." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { isAvailable: parsed.data.isAvailable },
  });

  return NextResponse.json({ ok: true });
}
