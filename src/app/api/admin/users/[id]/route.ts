import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({ isActive: z.boolean() });

type RouteParams = { params: Promise<{ id: string }> };

// The one write action on the otherwise read-only admin dashboard (TASKS.md
// 4.2): deactivate or reactivate an account. Deactivating doesn't delete
// anything, it blocks login (auth.ts) and signs out any session the
// account still holds (requireRole.ts), so a user's history stays intact
// and reactivating them restores exactly where they left off.
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "You can't deactivate your own account." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target || target.role === "ADMIN") {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  await prisma.user.update({ where: { id }, data: { isActive: parsed.data.isActive } });
  return NextResponse.json({ ok: true });
}
