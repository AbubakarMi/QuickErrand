import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, message: true, href: true, createdAt: true, readAt: true },
    }),
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
  ]);
  return NextResponse.json({ items, unread });
}

const markSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ ids: z.array(z.string()).min(1).max(50) }),
]);

// Mark notifications read: one or more by id, or all of them.
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const parsed = markSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await prisma.notification.updateMany({
    // Always scoped to the caller, so ids can't touch anyone else's.
    where: {
      userId: session.user.id,
      readAt: null,
      ...("ids" in parsed.data ? { id: { in: parsed.data.ids } } : {}),
    },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
